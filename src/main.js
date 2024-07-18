const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const {fork, spawn} = require("child_process");
const JSON5 = require("json5");
const fs = require('fs');
const expressAppProcess = require('./backend/server.js');

let config;
let mainWindow = null;
const EXEC_DIR = app.isPackaged ? process.resourcesPath : __dirname;
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
function findServerFile() {
  if (fs.existsSync(path.resolve(EXEC_DIR, 'app.asar'))) {
    return path.resolve(EXEC_DIR, 'app.asar', 'backend/server.js');
  }
  else {
    return path.resolve(EXEC_DIR, 'backend/server.js');
  }
}

// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  console.log(`App is ready on ${EXEC_DIR}`);
  config = JSON5.parse(fs.readFileSync(path.resolve(EXEC_DIR, "config/env.json5"), 'utf8'));
  // 启动后端服务器
  const expressPath = findServerFile();
  console.log(`fork on ${expressPath}`);
  expressAppProcess(EXEC_DIR, config.backend.port).catch(err => {
    console.error('Failed to start server:', err);
  });
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
