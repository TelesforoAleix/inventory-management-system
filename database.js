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

async function sellProduct(productDetail) {
    console.log('DB has received productDetail for sell', productDetail)
}


async function restockProduct(productDetail) {
    console.log('DB has received productDetail for restock', productDetail)
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
    sellProduct,
    restockProduct
 };