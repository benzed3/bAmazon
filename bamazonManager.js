var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    start();
    console.log("-----------------------------------");
});

function start() {
    inquirer
        .prompt({
            name: "doThis",
            type: "list",
            message: "Would you like to see items for [SALE], see low [INVENTORY], [ADD] to inventory, or add [NEW] product?",
            choices: ["SALE", "INVENTORY", "ADD", "NEW", "EXIT"]
        })
        .then(function (answer) {

            if (answer.doThis === "SALE") {
                itemsForSale();
            } else if (answer.doThis === "INVENTORY") {
                viewLowInventory();
            } else if (answer.doThis === "ADD") {
                addToInventory();
            } else if (answer.doThis === "NEW") {
                addNewProduct();
            } else {
                connection.end();
                console.log("See you later, then!")
            }
        });
};

function itemsForSale() {
    connection.query("SELECT * FROM products", function (err, res) {
        for (var i = 0; i < res.length; i++) {
            console.log(res[i].item_id + " || " +
                "PRODUCT: " + res[i].product_name + " || " +
                "DEPARTMENT: " + res[i].department_name + " || " +
                "PRICE: $" + res[i].price + " || " +
                "IN STOCK: " + res[i].stock_quantity);
        }
        console.log("-----------------------------------");
    });
}

function viewLowInventory() {
    connection.query("SELECT * FROM products", function (err, res) {
        var item;
        for (var i = 0; i < res.length; i++) {
            if (res[i].stock_quantity < 5) {
                console.log(res[i].product_name);
            }
        }
    });
}

function addToInventory() {

    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;

        inquirer
            .prompt([
                {
                    name: "update",
                    type: "rawlist",
                    choices: function () {
                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].product_name);
                        }
                        return choiceArray;
                    },
                    message: "What item would you like to stock?"
                },
                {
                    name: "quantity",
                    type: "input",
                    message: "Stock by how much?"
                }
            ])
            .then(function (answer) {

                var chosenItem;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].product_name === answer.update) {
                        chosenItem = results[i];
                    }
                }

                if (chosenItem.stock_quantity >= 0) {

                    connection.query(

                        "UPDATE products SET ? WHERE ?",
                        [
                            {
                                stock_quantity: chosenItem.stock_quantity + answer.quantity
                            },
                            {
                                item_id: chosenItem.item_id
                            }
                        ],
                        function (err) {
                            if (err) throw err;
                            console.log("Stock for " + chosenItem.product_name + " updated by " + answer.quantity + "!");
                            start();
                        }
                    );
                }
                else {

                    console.log("Insufficient quantity...");
                    start();
                }
            });
    });
}

function addNewProduct() {

    inquirer
        .prompt([
            {
                name: "product",
                type: "input",
                message: "What is the product you would like to add?"
            },
            {
                name: "dept",
                type: "input",
                message: "What department would you like add it into?"
            },
            {
                name: "price",
                type: "input",
                message: "What is the price?",
                validate: function (value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            },
            {
                name: "stock",
                type: "input",
                message: "How many in stock?",
                validate: function (value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            }
        ])
        .then(function (answer) {
            connection.query(
                "INSERT INTO products SET ?",
                {
                    product_name: answer.product,
                    department_name: answer.dept,
                    price: answer.price,
                    stock_quantity: answer.stock || 0
                },
                function (err) {
                    if (err) throw err;
                    console.log("Your product was created successfully!");
                    start();
                }
            );
        });
}