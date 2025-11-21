const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
const isDev = process.argv.some((arg) => arg === '--dev' || arg === '-d');
const appPath = app.getAppPath();
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    electronArgv: process.argv,
    hardResetMethod: 'quit',
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(appPath, 'public', 'preload.js'),
      devTools: isDev,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(appPath, 'build', 'index.html'));
  }
}

// 文件操作API
ipcMain.handle('select-files', async (_, options) => {
  const { defaultPath = null } = options;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    defaultPath: defaultPath,
  });
  return result.filePaths;
});

ipcMain.handle('select-folders', async (_, options) => {
  const { defaultPath = 'F:\\media' } = options;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'multiSelections'],
    defaultPath: defaultPath,
  });
  return result.filePaths;
});
ipcMain.handle('select-folder', async (_, options) => {
  const { defaultPath = '\\\\192.168.71.3\\' } = options;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    defaultPath: defaultPath,
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('move-files', async (_, { files, destination, moveConfig }) => {
  const results = [];

  for (const item of files) {
    try {
      const stats = await fs.stat(item);
      const isDirectory = stats.isDirectory();
      const itemName = path.basename(item);
      let destPath;

      // 根据配置处理目标路径
      if (moveConfig.organizeBy === 'date') {
        const date = stats.mtime.toISOString().split('T')[0];
        const dateFolder = path.join(destination, date);
        await fs.mkdir(dateFolder, { recursive: true });
        destPath = path.join(dateFolder, itemName);
      } else if (moveConfig.organizeBy === 'type') {
        if (isDirectory) {
          // 文件夹放在专门的文件夹分类中
          const typeFolder = path.join(destination, 'folders');
          await fs.mkdir(typeFolder, { recursive: true });
          destPath = path.join(typeFolder, itemName);
        } else {
          const ext = path.extname(item).toLowerCase() || 'no-extension';
          const typeFolder = path.join(destination, ext.substring(1));
          await fs.mkdir(typeFolder, { recursive: true });
          destPath = path.join(typeFolder, itemName);
        }
      } else {
        destPath = path.join(destination, itemName);
      }

      if (moveConfig.conflictResolution === 'rename') {
        destPath = await resolvePathConflict(destPath, isDirectory);
      }

      if (isDirectory) {
        await copyFolder(item, destPath, {
          overwrite: moveConfig.conflictResolution === 'overwrite',
          skipErrors: false,
        });
      } else {
        await fs.copyFile(item, destPath);
      }

      if (moveConfig.deleteOriginal) {
        if (isDirectory) {
          await fs.rm(item, { recursive: true, force: true });
        } else {
          await fs.unlink(item);
        }
      }

      results.push({
        item,
        destination: destPath,
        isDirectory,
        success: true,
      });
    } catch (error) {
      results.push({
        item,
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
  return [{ name: 'NAS-Share', path: '\\\\192.168.71.3\\' }];
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

ipcMain.on('path-basename', (event, p) => {
  if (!p) event.returnValue = '';
  else event.returnValue = path.basename(p);
});

ipcMain.on('path-join', (event, { ...paths }) => {
  event.returnValue = path.join(...paths);
});

// 根据文件内容匹配文件夹
async function findFoldersByContent(
  searchPath,
  sourceFiles,
  threshold,
  maxDepth = 3
) {
  const folders = [];

  try {
    // 使用深度优先搜索遍历所有子文件夹
    await traverseFolders(
      searchPath,
      0,
      maxDepth,
      async (folderPath, depth) => {
        const matchScore = await calculateFolderMatchScore(
          folderPath,
          sourceFiles
        );

        if (matchScore >= threshold) {
          folders.push({
            name: path.basename(folderPath),
            path: folderPath,
            matchScore: matchScore,
            fileCount: await countFilesInFolder(folderPath),
            depth: depth, // 添加深度信息
          });
        }
      }
    );

    // 按匹配度排序，匹配度相同的按深度排序（浅层优先）
    folders.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.depth - b.depth;
    });
  } catch (error) {
    console.error(`Error scanning ${searchPath}:`, error);
  }

  return folders;
}

// 深度优先遍历文件夹
async function traverseFolders(currentPath, currentDepth, maxDepth, callback) {
  if (currentDepth > maxDepth) {
    return;
  }

  try {
    const items = await fs.readdir(currentPath, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const folderPath = path.join(currentPath, item.name);

        // 跳过一些系统文件夹和隐藏文件夹
        if (shouldSkipFolder(item.name)) {
          continue;
        }

        // 执行回调函数处理当前文件夹
        await callback(folderPath, currentDepth);

        // 递归遍历子文件夹
        await traverseFolders(folderPath, currentDepth + 1, maxDepth, callback);
      }
    }
  } catch (error) {
    // 忽略无权限访问的文件夹
    if (error.code !== 'EACCES' && error.code !== 'EPERM') {
      console.error(`Error traversing ${currentPath}:`, error.message);
    }
  }
}

// 判断是否应该跳过某个文件夹
function shouldSkipFolder(folderName) {
  const skipFolders = [
    'node_modules',
    '.git',
    '.vscode',
    '.idea',
    '__pycache__',
    'tmp',
    'temp',
    'cache',
    'logs',
    'recycle bin',
    '$recycle.bin',
    'system volume information',
    '.trash',
    '.tmp',
    'lost+found',
  ];

  const normalizedName = folderName.toLowerCase();
  return skipFolders.includes(normalizedName) || normalizedName.startsWith('.');
}

// 计算文件夹匹配度
async function calculateFolderMatchScore(folderPath, sourceFiles) {
  let matchCount = 0;
  let totalComparisons = 0;

  try {
    const folders = await getAllFolders(folderPath);
    const folderNames = folders.map((f) => path.basename(f));

    for (const sourceFile of sourceFiles) {
      const sourceFileName = path.basename(sourceFile).toLowerCase();

      // 文件名完全匹配
      if (folderNames.includes(sourceFileName)) {
        matchCount += 1;
      }
      // 文件名相似度匹配
      else {
        const bestMatch = findBestFileNameMatch(sourceFileName, folderNames);
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
      console.log(sourceName, targetName, similarity);
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

async function getAllFolders(dirPath) {
  const dirs = [];
  async function scanDirectory(currentPath) {
    const items = await fs.readdir(currentPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);

      if (item.isDirectory()) {
        await scanDirectory(fullPath);
        dirs.push(fullPath);
      }
    }
  }
  await scanDirectory(dirPath);
  return dirs;
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

// 复制文件夹的通用函数
async function copyFolder(src, dest, options = {}) {
  const { overwrite = true, skipErrors = false } = options;

  try {
    // 检查源文件夹是否存在
    const stats = await fs.stat(src);
    if (!stats.isDirectory()) {
      throw new Error(`Source path is not a directory: ${src}`);
    }

    // 创建目标文件夹
    await fs.mkdir(dest, { recursive: true });

    // 读取源文件夹内容
    const items = await fs.readdir(src, { withFileTypes: true });

    for (const item of items) {
      const srcPath = path.join(src, item.name);
      const destPath = path.join(dest, item.name);

      if (item.isDirectory()) {
        // 递归复制子文件夹
        await copyFolder(srcPath, destPath, options);
      } else {
        // 复制文件
        try {
          if (overwrite || !(await fileExists(destPath))) {
            await fs.copyFile(srcPath, destPath);
          }
        } catch (error) {
          if (!skipErrors) throw error;
          console.warn(`Failed to copy file ${srcPath}:`, error.message);
        }
      }
    }
  } catch (error) {
    if (!skipErrors) throw error;
    console.warn(`Failed to copy folder ${src}:`, error.message);
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

// 处理路径冲突
async function resolvePathConflict(originalPath, isDirectory) {
  let counter = 1;
  let finalPath = originalPath;
  const { name, ext, dir } = path.parse(originalPath);

  while (await fileExists(finalPath)) {
    const suffix = isDirectory ? ` (${counter})` : ` (${counter})${ext}`;
    finalPath = path.join(dir, `${name}${suffix}`);
    counter++;
  }

  return finalPath;
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
