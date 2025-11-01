const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { networkInterfaces } = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
  }
}

// 文件操作API
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
  });
  return result.filePaths;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('move-files', async (_, { files, destination, moveConfig }) => {
  const results = [];

  for (const file of files) {
    try {
      const fileName = path.basename(file);
      let destPath;

      // 根据配置处理目标路径
      if (moveConfig.organizeBy === 'date') {
        const stats = await fs.stat(file);
        const date = stats.mtime.toISOString().split('T')[0];
        const dateFolder = path.join(destination, date);
        await fs.mkdir(dateFolder, { recursive: true });
        destPath = path.join(dateFolder, fileName);
      } else if (moveConfig.organizeBy === 'type') {
        const ext = path.extname(file).toLowerCase() || 'no-extension';
        const typeFolder = path.join(destination, ext.substring(1));
        await fs.mkdir(typeFolder, { recursive: true });
        destPath = path.join(typeFolder, fileName);
      } else {
        destPath = path.join(destination, fileName);
      }

      // 处理文件名冲突
      if (moveConfig.conflictResolution === 'rename') {
        let counter = 1;
        let finalDestPath = destPath;
        const { name, ext, dir } = path.parse(destPath);

        while (await fileExists(finalDestPath)) {
          finalDestPath = path.join(dir, `${name} (${counter})${ext}`);
          counter++;
        }
        destPath = finalDestPath;
      }

      await fs.copyFile(file, destPath);

      if (moveConfig.deleteOriginal) {
        await fs.unlink(file);
      }

      results.push({
        file,
        destination: destPath,
        success: true,
      });
    } catch (error) {
      results.push({
        file,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
});

// 网络文件夹支持
ipcMain.handle('get-network-shares', async () => {
  // 这里可以集成网络发现功能
  // 示例：返回模拟的网络共享
  return [
    { name: 'NAS-Share', path: '\\\\192.168.1.100\\shared' },
    { name: 'Office-Files', path: '\\\\office-server\\documents' },
  ];
});

ipcMain.handle(
  'connect-network-share',
  async (_, { path, username, password }) => {
    // 这里可以实现网络共享连接逻辑
    // 注意：这可能需要额外的系统权限和配置
    return { success: true, message: 'Connected successfully' };
  }
);
// 在现有的IPC handlers后添加

ipcMain.handle(
  'search-target-folders',
  async (_, { sourceFiles, searchPaths, matchThreshold }) => {
    const results = [];

    for (const searchPath of searchPaths) {
      try {
        const folders = await findFoldersByContent(
          searchPath,
          sourceFiles,
          matchThreshold
        );
        results.push({
          path: searchPath,
          folders: folders,
        });
      } catch (error) {
        results.push({
          path: searchPath,
          error: error.message,
          folders: [],
        });
      }
    }

    return results;
  }
);

// 根据文件内容匹配文件夹
async function findFoldersByContent(searchPath, sourceFiles, threshold) {
  const folders = [];

  try {
    const items = await fs.readdir(searchPath, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const folderPath = path.join(searchPath, item.name);
        const matchScore = await calculateFolderMatchScore(
          folderPath,
          sourceFiles
        );

        if (matchScore >= threshold) {
          folders.push({
            name: item.name,
            path: folderPath,
            matchScore: matchScore,
            fileCount: await countFilesInFolder(folderPath),
          });
        }
      }
    }

    // 按匹配度排序
    folders.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error(`Error scanning ${searchPath}:`, error);
  }

  return folders;
}

// 计算文件夹匹配度
async function calculateFolderMatchScore(folderPath, sourceFiles) {
  let matchCount = 0;
  let totalComparisons = 0;

  try {
    const folderFiles = await getAllFiles(folderPath);
    const folderFileNames = folderFiles.map((f) =>
      path.basename(f).toLowerCase()
    );

    for (const sourceFile of sourceFiles) {
      const sourceFileName = path.basename(sourceFile).toLowerCase();

      // 文件名完全匹配
      if (folderFileNames.includes(sourceFileName)) {
        matchCount += 1;
      }
      // 文件名相似度匹配
      else {
        const bestMatch = findBestFileNameMatch(
          sourceFileName,
          folderFileNames
        );
        if (bestMatch.similarity > 0.6) {
          matchCount += bestMatch.similarity;
        }
      }

      totalComparisons += 1;
    }
  } catch (error) {
    console.error(`Error calculating match score for ${folderPath}:`, error);
  }

  return totalComparisons > 0 ? matchCount / totalComparisons : 0;
}

// 查找最佳文件名匹配
function findBestFileNameMatch(sourceName, targetNames) {
  let bestMatch = { name: '', similarity: 0 };

  for (const targetName of targetNames) {
    const similarity = calculateStringSimilarity(sourceName, targetName);
    if (similarity > bestMatch.similarity) {
      bestMatch = { name: targetName, similarity };
    }
  }

  return bestMatch;
}

// 计算字符串相似度 (简易版)
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  return (
    (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length)
  );
}

// 编辑距离算法
function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// 获取文件夹内所有文件
async function getAllFiles(dirPath) {
  const files = [];

  async function scanDirectory(currentPath) {
    const items = await fs.readdir(currentPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);

      if (item.isDirectory()) {
        await scanDirectory(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await scanDirectory(dirPath);
  return files;
}

// 计算文件夹内文件数量
async function countFilesInFolder(folderPath) {
  try {
    const files = await getAllFiles(folderPath);
    return files.length;
  } catch {
    return 0;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
