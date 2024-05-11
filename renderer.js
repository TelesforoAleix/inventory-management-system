const { error } = require('console');
const { ipcRenderer, Notification } = require('electron');

//// background functions

//receive and show notifications on the top
ipcRenderer.on('show-notification', (event, response) => {
    showMessage(response);
});

function showMessage(message) {
    document.getElementById('notification').innerHTML = message;
    setTimeout(() => {
        document.getElementById('notification').innerHTML = ''}, 3000); ;
};

// update dashboard when page is loaded
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
});

// update dashboard functions
async function updateDashboard() {
    cleanForms();
    updateInventory();
    updateTransactions();
    showTransactions();
}

    function updateInventory() {
        ipcRenderer.send('get-inventory-data');
    };

    function updateTransactions() {
        ipcRenderer.send('get-transaction-history');
    };

    // listener for inventoryData
    ipcRenderer.on('inventory-info', (event, message, inventoryData) => {
        showMessage(message);
        updateInventoryMetrics(inventoryData);
        console.log(inventoryData);
    });

    ipcRenderer.on('transaction-history', (event, transactionList) => {
        console.log(transactionList);
        showTransactions(transactionList);
    });

    ipcRenderer.on('transaction-register', (event, message) => {
        showMessage(message);
    });

//// event listeners

// add product button (addButton)
const addButton = document.getElementById('addProduct');
addButton.addEventListener('click', addProduct)

function addProduct() {

    const productDetail = getProductDetail(); 
    const transactionType = 'add';

    console.log(`product data and transactionType has been created for: ${productDetail} and ${transactionType}`);

    if (!productDetail.ref || !productDetail.name || isNaN(productDetail.quantity) || isNaN(productDetail.cost) || isNaN(productDetail.pvp)) {
        console.log('There is some important missing data');
        showMessage('Some fields are missing important data');
    } else {
        registerTransaction(productDetail, transactionType);
        ipcRenderer.send('add-product', productDetail, transactionType );
    };

    updateDashboard();
} 

function getProductDetail() {
    const productDetail = {
    ref: document.getElementById('ref').value,
    name: document.getElementById('name').value,
    quantity: parseInt(document.getElementById('quantity').value, 10),
    cost: parseFloat(document.getElementById('cost').value),
    pvp: parseFloat(document.getElementById('pvp').value)
    };
    return productDetail;
}

// add product (random) button
const addRandomButton = document.getElementById('addRandomProduct');
addRandomButton.addEventListener('click', addRandomProduct)

function addRandomProduct() {
    const productDetail = generateRandomProductData();
    const transactionType = "add";

    if (!productDetail.ref || !productDetail.name || isNaN(productDetail.quantity) || isNaN(productDetail.cost) || isNaN(productDetail.pvp)) {
        const message = 'Error generating random data';
        console.log(message);
        showMessage(message);
    } else {
        console.log(`Random data has been created for: ${productDetail.name}`)
        registerTransaction(productDetail, transactionType);
        ipcRenderer.send('add-product', productDetail);
        showMessage(`Random data has been created for: ${productDetail.name}`);
    }

    updateDashboard();
}


// clean inventory listener
const cleanButton = document.getElementById('cleanButton');
cleanButton.addEventListener('click', () => {
    try {
        ipcRenderer.send('clean-database');
        console.log('Cleaning database...');
    } catch (error) {
        console.error('Error cleaning database:', error);
    }
});

ipcRenderer.on('database-cleaned', (event, message) => {
    console.log(message);
    showMessage(message);
    updateDashboard();
});


//// dom moficiations
 
    // populate dropdown to transact with a product (restock or sell)

    // Update data shown on Inventory Metrics
    function updateInventoryMetrics(inventoryData) {
        document.getElementById('availableStock').textContent = inventoryData.units;
        document.getElementById('numberOfModels').textContent = inventoryData.models;
        document.getElementById('inventoryValue').textContent = inventoryData.inventoryValue.toFixed(2);
    }


    // Update data shown on Financials

 
//// calculus and other funcitons

function cleanForms() {
    // Register new product form
    document.getElementById('ref').value = '';
    document.getElementById('name').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('cost').value = '';
    document.getElementById('pvp').value = '';
    // Sell form
    document.getElementById('productDropdownRestock').value = '';
    document.getElementById('quantityRestock').value = '';
    document.getElementById('purchasePrice').value = '';
    // Restock Form        
    document.getElementById('productDropdownSell').value = '';
    document.getElementById('quantitySell').value = '';
    document.getElementById('salesPrice').value = '';
} 

// 
function generateRandomProductData() {
    
    const cost = parseFloat((Math.random() * 100).toFixed(2)); 
    const pvp = (cost * 1.30).toFixed(2); 

    const productDetail = {
        ref: 'REF' + Math.floor(Math.random() * 1000), // Example: REF123
        name: 'Product ' + Math.floor(Math.random() * 100), // Example: Product 42
        quantity: Math.floor(Math.random() * 50), // Or 0, as prefered
        cost: cost,
        pvp: pvp,
    }
    return productDetail;
}

// Register transactions || add, restock, sell
function registerTransaction(productDetail, transactionType) {   
    const {ref, name, quantity, cost, pvp } = productDetail  
    const rawDate = new Date();
    const dateOptions =  {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short'
    };

    const transactionDetail = {
        time: rawDate.toLocaleString('en-US', dateOptions),
        transactionType: transactionType,
        productId: productDetail.ref,
        productName: productDetail.name,
        unitaryPrice: "", 
        quantityMoved: "",
        totalAmount: "",
    }

    switch (transactionType) {
        case "add":
            transactionDetail.unitaryPrice = productDetail.cost,
            transactionDetail.quantityMoved = productDetail.quantity,
            transactionDetail.totalAmount= ( productDetail.cost * productDetail.quantity ).toFixed(2)
        break;
        
        case "restock":
            transactionDetail.unitaryPrice = productDetail.purchasePrice,
            transactionDetail.quantityMoved = productDetail.quantityRestock,
            transactionDetail.totalAmount= ( productDetail.cost * productDetail.quantityRestock ).toFixed(2)
        break;

        case "sell":
            transactionDetail.unitaryPrice = productDetail.salesPrice,
            transactionDetail.quantityMoved = productDetail.quantitySell,
            transactionDetail.totalAmount= ( productDetail.salesPrice * productDetail.quantitySell ).toFixed(2)
        break;

        default: 
        console.log('There is an issue registering transaction, transaction type hasnt been shared')
    } 

    ipcRenderer.send("new-transaction", transactionDetail);

return transactionDetail;
};

function showTransactions(transactionList) {
    const transactionTable = document.getElementById('transactionRows');

    while (transactionTable.firstChild) {
        transactionTable.removeChild(transactionTable.firstChild);
    }

    for (let i = transactionList.length - 1; i >= 0; i--) {
        const transaction = transactionList[i];
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${transaction.time}</td>
        <td>${transaction.transactionType}</td>
        <td>${transaction.ref}</td>
        <td>${transaction.name}</td>
        <td>${transaction.unitaryPrice}</td>
        <td>${transaction.quantityMoved}</td>
        <td>${transaction.totalAmount}</td>
      `;
    transactionTable.appendChild(row);
    }
}
