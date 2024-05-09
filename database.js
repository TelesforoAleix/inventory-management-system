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



    // Process information


// Clean all databases

function cleanInventory() {
    let sql = 'DELETE FROM inventory';
    return runQuery(sql, []);
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
    getInventory
 };