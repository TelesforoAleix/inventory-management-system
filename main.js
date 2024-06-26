// import modules and functions from other documents
const { app, BrowserWindow, ipcMain } = require ('electron');
const sqlite = require('sqlite3');

const db = require('./database');


let mainWindow

// function to create window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1680, // without devtools, 1280
        height: 900,
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
    mainWindow.openDevTools();

    mainWindow.on('closed',  () => {      
        mainWindow = null
        });
};


// when page is ready, start app and render information
app.on('ready', () => {
    //create window
    createWindow();

    // add listeners for messages from renderer

    // add product listener
  ipcMain.on('add-product', (event, productDetail) => {
    addProduct(productDetail);
    event.sender.send('update-page');
  });

  ipcMain.on('transact-product', (event, productDetail, transactionType) => {
    transactProduct(productDetail, transactionType);
    event.sender.send('update-page');
  })

  ipcMain.on('new-transaction', async (event, transactionDetail) => {
    console.log('transaction received from renderer to main', transactionDetail);
    try {
      await db.registerTransaction(transactionDetail);
      event.sender.send('transaction-register', 'Transaction registered succesfully');
    } catch (error) {
      console.error('Error registering transaction: ', error);
      event.sender.send('transaction-register', error.message);
    }

  });

    // clean database 
  ipcMain.on('clean-database', async (event) => {
    try {
      await db.cleanInventory();
      event.sender.send('database-cleaned', 'Inventory cleaned successfully' )
    } catch (error) {
      console.error('Error cleaning inventory:', error);
      event.sender.send('database-cleaned', error.message);
    }
  });


    // get database information
  ipcMain.on('get-inventory-data', async (event) => {
    try {
      let inventoryData = await db.getInventory();
      event.sender.send('inventory-info', 'Inventory data updated', inventoryData )
    } catch (error) {
      console.error('Error getting inventory data:', error);
      event.sender.send('inventory-info', error.message);
    }
  });


  ipcMain.on('get-transaction-history', async (event) => {
    try {
      const transactionList = await db.getTransactions();
      event.sender.send('transaction-history', transactionList);
    } catch (error) {
      console.error('Error getting transactions: ', error);
      event.sender.send('show-notification', 'Error getting transaction history', error.message);
    }
  });

  ipcMain.on('get-financial-metrics', async (event) => {
    try {
      let financialMetrics = await db.financialMetrics();
      event.sender.send('financial-metrics', financialMetrics);
    } catch (error) {
      console.error('Error getting financial data: ', error);
      event.sender.send('show-notification', 'Error getting financial metrics', error.message);
    }
  });
});

// functions to interact with database.db

async function addProduct(productDetail) {
  try {
    await db.newProduct(productDetail);
  } catch (error) {
    console.error('Error handling add-product event:', error);
  }

}


async function transactProduct(productDetail, transactionType) {
  try {
    await db.updateStock(productDetail, transactionType);
            
  } catch (error) {
    console.error('Error handling add-product event:', error);
  }
}



// if program active but window closed, create new window
app.on('activate', () => {
    if (mainWindow === null) createWindow()
  })


// quit the app when last window is close
app.on('window-all-closed', () => {
  app.quit()
})

