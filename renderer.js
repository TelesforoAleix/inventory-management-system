const { ipcRenderer, Notification } = require('electron')

//// background functions

//receive and show notifications on the top
ipcRenderer.on('show-notification', (event, response) => {
    showMessage(response);
});

function showMessage(message) {
    document.getElementById('notification').innerHTML = response;
    setTimeout(() => {
        document.getElementById('notification').innerHTML = ''}, 5000); ;
};


//update data
ipcRenderer.on('update-dashboard', (event, transactionLog, inventory, financials) => {
    console.log(transactionLog);
    console.log(inventory);
    console.log(financials);
});

async function updateDashboard() {
    console.log("Updating data on the website");

}

//// event listeners
/* 
Event listener for the "Add Product" button (addButton)
Event listener for the "Add Random Examples" button (addRandomExamplesButton)
Event listener for the "Sell Product" button (sellButton)
Event listener for the "Restock Product" button (restockButton)

Event listener for the "Clean Inventory" button (cleanInventory)

Event listener for changes in the product dropdown menu for selling (productDropdownSell)
Event listener for changes in the product dropdown menu for restocking (productDropdownRestock)
*/

// add product button (addButton)
const addButton = document.getElementById('addProduct');
addButton.addEventListener('click', addProduct)

function addProduct() {
    const productDetail = {
        ref: document.getElementById('ref').value,
        name: document.getElementById('name').value,
        quantity: parseInt(document.getElementById('quantity').value, 10),
        cost: parseFloat(document.getElementById('cost').value),
        pvp: parseFloat(document.getElementById('pvp').value)
    };
    const transactionType = 'add'
    
    if (!productData.ref || !productData.name || isNaN(productData.quantity) || isNaN(productData.predRestockPrice) || isNaN(productData.predSellingPrice)) {
        console.log('There is some important missing data');
        showMessage('Some fields are missing important data');
    } else {
        registerTransaction(productDetail, transactionType)
        ipcRenderer.send('add-product', productDetail, transactionDetail )
        cleanForms();
    };
}

//// dom moficiations



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
    const productDetail = {
        ref: 'REF' + Math.floor(Math.random() * 1000), // Example: REF123
        name: 'Product ' + Math.floor(Math.random() * 100), // Example: Product 42
        quantity: 0, //Math.floor(Math.random() * 50),
        cost: parseFloat((Math.random() * 100).toFixed(2)),
        pvp: (cost * 1.30).toFixed(2),
    }
    return productDetail;
}

// Register transactions || add, restock, sell
function registerTransaction(productDetail, transactionType) {      
    
    const {ref, name, quantity, cost, pvp, } = productDetail  
    const transactionDetail = {
        time: Date.now(),
        transactionType: transactionType,
        productId: productDetail.ref,
        productName: productDetail.name,
    }

    switch (transactionType) {
        case add:
            transactionDetail.unitaryPrice = productDetail.cost,
            transactionDetail.quantityMoved = productDetail.quantity,
            transactionDetail.totalAmount= ( productDetail.cost * productDetail.quantity ).toFixed(2)
            console.log('We have successfully create the register transaction from add');
        return transactionDetail;
        break;
        
        case restock:
            transactionDetail.unitaryPrice = productDetail.purchasePrice,
            transactionDetail.quantityMoved = productDetail.quantityRestock,
            transactionDetail.totalAmount= ( productDetail.cost * productDetail.quantityRestock ).toFixed(2)
            console.log('We have successfully create the register transaction from restock');
        return transactionDetail;           
        break;

        case sell:
            transactionDetail.unitaryPrice = productDetail.salesPrice,
            transactionDetail.quantityMoved = productDetail.quantitySell,
            transactionDetail.totalAmount= ( productDetail.salesPrice * productDetail.quantitySell ).toFixed(2)
            console.log('We have successfully create the register transaction from sell');
        return transactionDetail;
        break;

        default: 
        console.log('There is an issue registering transaction, transaction type hasnt been shared')
    } 

return transactionDetail;
};
