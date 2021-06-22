let db;

// establis a connection to indexed db database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database verstion changes (nonexistent to version 1, v1 to v2, etc)
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;

    // create an object store (table) called 'new_transaction', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

//upon a successful
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradeneeded event above) or simply established a connectio, save refernce to db in global variable
    db = event.target.result;

    // check if app is online, if yes, run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
        // we havent created this yet, so lets comment it out for now
        uploadTransaction();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
}

// this function will be executed if we attempt to submit a new transaction and theres no internet connection
function saveRecord(record) {
    // open a new transaction with the datagbase with read and write permisions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for 'new_transaction'
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // add record to your  store with add method
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access your object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set it to a variable
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there was data in indexedDB's store, lets send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if(serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite');

                    //access the new_transaction object store
                    const transactionObjectStore = transaction.objectStore('new_transaction');

                    //clear all items in your store
                    transactionObjectStore.clear();

                    alert('all saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                })
        }
    };
}

window.addEventListener('online', uploadTransaction);