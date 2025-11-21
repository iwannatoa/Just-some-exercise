const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件选择
  selectFiles: () => ipcRenderer.invoke('select-files', {}),
  selectFolders: () => ipcRenderer.invoke('select-folders', {}),
  selectFolder: () => ipcRenderer.invoke('select-folder', {}),

  // 文件移动
  moveFiles: (config) => ipcRenderer.invoke('move-files', config),

  // 网络共享
  getNetworkShares: () => ipcRenderer.invoke('get-network-shares'),
  connectNetworkShare: (config) =>
    ipcRenderer.invoke('connect-network-share', config),

  // 工具函数
  path: {
    basename: (path) => ipcRenderer.sendSync('path-basename', path),
    join: (...paths) => ipcRenderer.sendSync('path-join', ...paths),
  },

  // 新增匹配搜索功能
  searchTargetFolders: (config) =>
    ipcRenderer.invoke('search-target-folders', config),

  // 工具函数
  utils: {
    calculateSimilarity: (str1, str2) => {
      // 客户端相似度计算
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      if (longer.length === 0) return 1.0;
      return (
        (longer.length - editDistance(longer, shorter)) /
        parseFloat(longer.length)
      );
    },
  },
});

// 编辑距离函数
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
