// import modules and functions from other documents
const { app, BrowserWindow, ipcMain } = require ('electron');
const sqlite = require('sqlite3');

const db = require('./database');


// function to create window
function createWindow() {
    let mainWindow = new BrowserWindow({
        width: 1280, 
        height: 800,
        x: 30,
        y: 30, 
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    })
    mainWindow.show();
    mainWindow.focus();
    mainWindow.loadFile('index.html');
    // mainWindow.openDevTools();

    mainWindow.on('closed',  () => {      
        mainWindow = null
        });
};


// when page is ready, start app and render information
app.on('ready', () => {
    //create window
    createWindow();


    ipcMain.on('add-product', newProduct)

});

// if program active but window closed, create new window
app.on('activate', () => {
    if (mainWindow === null) createWindow()
  })


// quit the app when last window is close
app.on('window-all-closed', () => {
  app.quit()
})