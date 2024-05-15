const sqlite3 =  require('sqlite3');

// Create a SQLite database --> INVENTORY.DB
const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    }
 });


// Functions to interact with the database. Create a promise and err handling

function runQuery(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) {
                console.log('runQuery function didnt work');
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
}

function getData(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, result) => {
            if (err) {
                console.log('getData function didnt work');
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

function getMetric(query, params) {
    return new Promise ((resolve, reject) => {
        db.get(query, params, (err, result) => {
            if (err) {
                console.log('getMetric function didnt work');
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}


// Functions to be called from main.js
    // Retrieve information

async function getInventory() {
    const metrics = await inventoryMetrics();
    
    let inventoryData = {
        units: metrics.units || 0,
        models: metrics.models || 0,
        inventoryValue: metrics.inventoryValue || 0, 
        products: await inventoryList(),   
    }

    return inventoryData;
}

async function inventoryList() {
    let inventoryData
    try {
        let sql = 'SELECT * FROM inventory'
        let params = [];

        inventoryData = {
            products: await getData(sql, params)
        }        
        } catch (error) {
            console.log('inventoryList function didnt work', error)
        };
    return inventoryData.products;
}

async function getTransactions() {
    let transactionList
    let sql = 'SELECT * FROM transactions'
    let params = []

    transactionList = await getData(sql, params);
    return transactionList;
}

async function inventoryMetrics() {
    let inventoryMetricsData; 
    try {
        let sql = ` SELECT COUNT(*) AS models, 
                    SUM(quantity) AS units, 
                    SUM(totalValue) AS inventoryValue 
                    FROM inventory `;
        let params = [];
        
        inventoryMetricsData = await getMetric(sql, params) 

    } catch (error) {
        console.log('inventoryMetrics function didnt work', error)
    };

    return inventoryMetricsData;
}

async function registerTransaction(transactionDetail) {

        // import value from main.js as productDetail
    const { time, transactionType, productId, productName, unitaryPrice, quantityMoved, totalAmount } = transactionDetail;

    let sql = 'INSERT INTO transactions ( time, transactionType, ref, name, unitaryPrice, quantityMoved, totalAmount ) VALUES (?, ?, ?, ?, ?, ?, ?)' ;

    let params = [time, transactionType, productId, productName, unitaryPrice, quantityMoved, totalAmount] ;

    await runQuery(sql, params);
};

    // Compute Financial Metrics

async function financialMetrics() {
    const financialData = {
        salesTransactions: await getNumberOfSales(),
        salesUnits: await getItemsSold(),
        totalRevenue: await getTotalRevenue(),
        totalCogs: await getTotalCogs(),
        grossProfit: await getGrossProfit(),
        atv: await getAverageTicketSales(),
        upt: await getUnitsPerTransaction()
    }
    return financialData;
}

async function getNumberOfSales() {
    try {
        const query = 'SELECT COUNT(*) AS salesTransactions FROM transactions WHERE transactionType = "sell"';
        const result = await getMetric(query, []);
        return result.salesTransactions || 0;

    } catch (error) {
        console.error('Error retrieving number of sales:', error);
        return 0;
    }  
}

async function getItemsSold(){
    try {
        const query = 'SELECT SUM(quantityMoved) AS salesUnits FROM transactions WHERE transactionType = "sell"';
        const result = await getMetric(query, []);
        return result.salesUnits || 0;

    } catch (error) {
        console.error('Error retrieving number of sales:', error);
        return 0;
    }
}   

async function getTotalRevenue(){
    try {
        const query = 'SELECT SUM(totalAmount) AS totalRevenue FROM transactions WHERE transactionType = "sell"';
        const result = await getMetric(query, []);
        return result.totalRevenue || 0;

    } catch (error) {
        console.error('Error retrieving number of sales:', error);
        return 0;
    } 
}

async function getTotalCogs(){
    try {
        const queryCosts = 'SELECT SUM(totalAmount) AS totalCost FROM transactions WHERE transactionType = "restock" OR transactionType = "add"';
        const costObj = await getMetric(queryCosts, []);
        const cost = costObj.totalCost;

        const queryInventory = 'SELECT SUM(totalValue) AS inventoryValue FROM inventory';
        const inventoryObj = await getMetric(queryInventory, []);
        const inventory = inventoryObj.inventoryValue;


        return (cost - inventory) || 0;
    } catch (error) {
        console.error('Error retrieving number of sales:', error);
        return 0;
    } 
}

async function getGrossProfit(){
    try {
        const revenue = await getTotalRevenue();
        const cogs = await getTotalCogs();

        return (revenue - cogs) || 0;
    } catch (error) {
        console.error('Error retrieving number of sales:', error);
        return 0;
    } 
}

async function getAverageTicketSales(){
    try {
        const revenue = await getTotalRevenue();
        const salesTransactions = await getNumberOfSales();

        return (revenue / salesTransactions) || 0;
    } catch (error) {
        console.error('Error retrieving number of sales:', error);
        return 0;
    } 
}

async function getUnitsPerTransaction(){
    try {
        const salesUnits = await getItemsSold();
        const salesTransactions = await getNumberOfSales();

        return (salesUnits / salesTransactions) || 0;
    } catch (error) {
        console.error('Error retrieving number of sales:', error);
        return 0;
    } 
}
    // Modify database

async function newProduct(productDetail) {

    // import value from main.js as productDetail
    const { ref, name, quantity, cost, pvp } = productDetail
    let sql, params;

    if (productDetail.quantity == 0) {
        sql = 'INSERT INTO inventory (ref, name, quantity, cost, pvp, avgCost, totalValue) VALUES (?, ?, ?, ?, ?, ?, ?)';
        params = [ ref, name, quantity, cost, pvp, cost, (quantity*cost) ];  
    } else {
        sql = 'INSERT INTO inventory (ref, name, quantity, cost, pvp, avgCost, totalValue) VALUES (?, ?, ?, ?, ?, ?, ?)';
        params = [ ref, name, quantity, cost, pvp, cost, (quantity*cost) ];   
    };

    await runQuery(sql, params);
};

async function updateStock(productDetail, transactionType) {
    const prevProduct = await getProductByRef(productDetail.ref);
    let newStock
    let newTotalValue
    const sql = `UPDATE inventory SET quantity = ?, totalValue = ? WHERE ref = ?`;
    let params = [];
    console.log('Info we get from database and transaction: ', prevProduct, productDetail, transactionType);

    try {  
        switch (transactionType) {
            case "sell":
                newStock = prevProduct.quantity - productDetail.quantity;
                newTotalValue = newStock * prevProduct.cost;  
                params = [newStock, newTotalValue, productDetail.ref];
                console.log('transactionType updateStock working, sell')
            break;
          
            case "restock":
                newStock = prevProduct.quantity + productDetail.quantity; 
                newTotalValue = prevProduct.totalValue + (productDetail.quantity * productDetail.cost);
                params = [newStock, newTotalValue, productDetail.ref];
                console.log('transactionType updateStock working, restock');
              break;
        
            default:
              console.log('TransactionType for Sell or Restock not correct');
              break;
          }
        await runQuery(sql, params)

    } catch (error) {
        console.log('updateStock function didnt work', error)
    }
    
    console.log('DB has updated inventory', this.lastID);
}

async function getProductByRef(ref) {
    try {
        const query = `SELECT * FROM inventory WHERE ref = ?`;
        const result = await getMetric(query, [ref]);
        return result;
    } catch (error) {
        console.error('Error retrieving product by ref:', error);
        return null;
    }
}


    // Process information


// Clean all databases 

async function cleanInventory() {
    let sql = 'DELETE FROM inventory';
    await runQuery(sql, []);
    let sql2 = 'DELETE FROM transactions';
    await runQuery(sql2, []);

}


// Create two tables on the database: inventory and transactions

    db.run(`CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ref VARCHAR(20),
        name TEXT,
        quantity INTEGER,
        cost MONEY, 
        pvp MONEY, 
        avgCost MONEY, 
        totalValue MONEY
    )`);


    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time INTEGER,
        transactionType TEXT,
        ref VARCHAR(20), 
        name TEXT,
        unitaryPrice REAL,
        quantityMoved INTEGER,
        totalAmount REAL,
        FOREIGN KEY(ref) REFERENCES inventory(ref), 
        FOREIGN KEY(name) REFERENCES inventory(name)
    )`);


// Export modules to use in main.js
module.exports = {
    newProduct, 
    cleanInventory,
    getInventory, 
    registerTransaction, 
    getTransactions, 
    updateStock, 
    financialMetrics
 };