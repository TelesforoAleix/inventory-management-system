const { error } = require('console');
const { ipcRenderer} = require('electron');

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
    await updateInventory();
    await updateTransactions();
}

    function updateInventory() {
        ipcRenderer.send('get-inventory-data');
    };

    function updateTransactions() {
        ipcRenderer.send('get-transaction-history');
    };

    // listener for inventoryData
    let inventoryData;
    ipcRenderer.on('inventory-info', (event, message, inventoryData) => {
        updateInventoryMetrics(inventoryData);
        showProducts(inventoryData);
        populateDropdown(inventoryData);
    });

    // listener for transactionList
    ipcRenderer.on('transaction-history', (event, transactionList) => {
        console.log(transactionList);
        showTransactions(transactionList);
    });

    ipcRenderer.on('transaction-register', (event, message) => {
        showMessage(message);
    });

    ipcRenderer.on('update-page', (event) => {
        updateDashboard();
    })

//// event listeners

// add product button (addButton)
const addButton = document.getElementById('addProduct');
addButton.addEventListener('click', addProduct)

async function addProduct() {
    const productDetail = getProductDetail(); 
    const transactionType = 'add';
    console.log('Hey, the error should be here, look at that: ', productDetail, inventoryData);

    if (!productDetail.ref || !productDetail.name || isNaN(productDetail.quantity) || isNaN(productDetail.cost) || isNaN(productDetail.pvp)) {
        console.log('There is some important missing data');
        showMessage('Some fields are missing important data');
    } else {
        registerTransaction(productDetail, transactionType);
        await ipcRenderer.send('add-product', productDetail, transactionType );
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

// restock product button
const restockButton = document.getElementById('restockProduct');
restockButton.addEventListener('click', restockProduct)

async function restockProduct(){
    const productDetail = getRestockDetail();
    const transactionType = 'restock';

    if (!productDetail.ref || !productDetail.name || isNaN(productDetail.quantity) || isNaN(productDetail.cost)) {
        console.log('There is some important missing data');
        showMessage('Some fields are missing important data');
    } else {
        registerTransaction(productDetail, transactionType);
        await ipcRenderer.send('transact-product', productDetail, transactionType );
    };

    updateDashboard();
} 


function getRestockDetail() {
    const restockDetail = {
        ref: document.getElementById('productIdRestock').textContent,
        name: document.getElementById('productDropdownRestock').value,
        quantity: parseInt(document.getElementById('quantityRestock').value, 10),
        cost: parseFloat(document.getElementById('restockPrice').value),
        };
    return restockDetail;
}


// sell product button
const sellButton = document.getElementById('sellProduct');
sellButton.addEventListener('click', sellProduct)

async function sellProduct(){
    const productDetail = getSellDetail();
    const transactionType = 'sell';
    const availableStock = parseInt(document.getElementById('availableStockSell').innerHTML, 10);
    console.log(availableStock, productDetail.quantity);

    if (productDetail.quantity > availableStock) {
        showMessage('Not enough stock, please restock');
        console.log('Trying to sell more than available');
    } else {
         if (!productDetail.ref || !productDetail.name || isNaN(productDetail.quantity) || isNaN(productDetail.price)) {
            console.log('There is some important missing data');
            showMessage('Some fields are missing important data');
        } else {
            registerTransaction(productDetail, transactionType);
            await ipcRenderer.send('transact-product', productDetail, transactionType );
        };

    updateDashboard();
    }

}

function getSellDetail() {
    const sellDetail = {
        ref: document.getElementById('productIdSell').textContent,
        name: document.getElementById('productDropdownSell').value,
        quantity: parseInt(document.getElementById('quantitySell').value, 10),
        price: parseFloat(document.getElementById('sellPrice').value),
        };
    return sellDetail;
}

// add product (random) button
const addRandomButton = document.getElementById('addRandomProduct');
addRandomButton.addEventListener('click', addRandomProduct)

async function addRandomProduct() {
    const productDetail = generateRandomProductData();
    const transactionType = "add";

    if (!productDetail.ref || !productDetail.name || isNaN(productDetail.quantity) || isNaN(productDetail.cost) || isNaN(productDetail.pvp)) {
        const message = 'Error generating random data';
        console.log(message);
        showMessage(message);
    } else {
        console.log(`Random data has been created for: ${productDetail.name}`)
        registerTransaction(productDetail, transactionType);
        await ipcRenderer.send('add-product', productDetail);
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
        document.getElementById('inventoryValue').textContent = inventoryData.inventoryValue.toFixed(2)+"€";
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
    // Restock form
    document.getElementById('productDropdownRestock').value = '';
    document.getElementById('productIdRestock').textContent = '';
    document.getElementById('quantityRestock').value = '';
    document.getElementById('restockPrice').value = '';
    document.getElementById('availableStockRestock').textContent = '';
    document.getElementById('restockCost').textContent = '';
    // Sell Form        
    document.getElementById('productDropdownSell').value = '';
    document.getElementById('productIdSell').textContent = '';
    document.getElementById('quantitySell').value = '';
    document.getElementById('sellPrice').value = '';
    document.getElementById('availableStockSell').textContent = '';
    document.getElementById('sellingPrice').textContent = '';

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
            transactionDetail.totalAmount= ( productDetail.cost * productDetail.quantity).toFixed(2)
        break;
        
        case "restock":
            transactionDetail.unitaryPrice = productDetail.cost,
            transactionDetail.quantityMoved = productDetail.quantity,
            transactionDetail.totalAmount= ( productDetail.cost * productDetail.quantity).toFixed(2)
        break;

        case "sell":
            transactionDetail.unitaryPrice = productDetail.price,
            transactionDetail.quantityMoved = productDetail.quantity,
            transactionDetail.totalAmount= ( productDetail.price * productDetail.quantity ).toFixed(2)
        break;

        default: 
        console.log('There is an issue registering transaction, transaction type hasnt been shared')
    } 

    ipcRenderer.send("new-transaction", transactionDetail);

return transactionDetail;
};

// update transaction history with new array received
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

// update inventory cards based on available products

function showProducts(inventoryData) {
    const productsCards = document.getElementById('stock-products');
    const products = inventoryData.products;
    products.sort((a, b) => a.quantity - b.quantity);

    while (productsCards.firstChild) {
        productsCards.removeChild(productsCards.firstChild);
    }

    for (let i = products.length - 1; i >= 0; i--) {
        const product = products[i];
        const card = document.createElement('div');
        card.classList.add('productsCards');
        card.innerHTML = `
        <h5>${product.ref}</h4>
        <h3>${product.name}</h3>
        <p>Stock: ${product.quantity}</p>
        <p>PVP: ${product.pvp}€</p>
        <p>Stock Value: ${product.totalValue.toFixed(2)}€</p>`;
    productsCards.appendChild(card);
    }
}

// update dropdown menu for restock and sell
function populateDropdown(inventoryData){
    const dropdowns = document.getElementsByClassName('productDropdown');
    const products = inventoryData.products;

    // Iterate over each dropdown
    Array.from(dropdowns).forEach(dropdown => {
        dropdown.innerHTML = '';

        // Add placeholder option
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'Select a product...';
        dropdown.appendChild(placeholderOption);

        // Populate dropdown with product options
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.name;
            option.textContent = product.name;
            dropdown.appendChild(option);           
        });
    });


//show information about selected product dropdowns, restock and sell

    // Add event listener to Restock dropdown for changes (e.g., selecting a product)
    const productDropdownRestock = document.getElementById('productDropdownRestock');

    productDropdownRestock.addEventListener('change', (event) => {
        const selectedProduct = event.target.value;
        const selectedProductInfo = inventoryData.products.find(product => product.name === selectedProduct);

        if (selectedProductInfo) {
            document.getElementById('productIdRestock').textContent = selectedProductInfo.ref;
            document.getElementById('availableStockRestock').textContent = selectedProductInfo.quantity;
            document.getElementById('restockCost').textContent = selectedProductInfo.cost;
        }
    });

    // Add event listener to Restock dropdown for changes (e.g., selecting a product)
    const productDropdownSell = document.getElementById('productDropdownSell');

    productDropdownSell.addEventListener('change', (event) => {
        const selectedProduct = event.target.value;
        const selectedProductInfo = inventoryData.products.find(product => product.name === selectedProduct);

        if (selectedProductInfo) {
            document.getElementById('productIdSell').textContent = selectedProductInfo.ref;
            document.getElementById('availableStockSell').textContent = selectedProductInfo.quantity;
            document.getElementById('sellingPrice').textContent = selectedProductInfo.pvp;
        }
    });

}

