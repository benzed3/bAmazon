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
    console.log("-----------------------------------");
    start();
    queryProducts();
    console.log("-----------------------------------");
});

function queryProducts() {
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



function start() {
    inquirer
        .prompt({
            name: "buyOrLeave",
            type: "list",
            message: "Would you like to [SHOP] today?",
            choices: ["SHOP", "EXIT"]
        })
        .then(function (answer) {

            if (answer.buyOrLeave === "SHOP") {
                shop();

            } else {
                connection.end();
                console.log("See you later, then!")
            }
        });
};

function shop() {

    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;

        inquirer
            .prompt([
                {
                    name: "choice",
                    type: "rawlist",
                    choices: function () {
                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].product_name);
                        }
                        return choiceArray;
                    },
                    message: "What would you like to buy?"
                },
                {
                    name: "quantity",
                    type: "input",
                    message: "How many would you like to buy?"
                }
            ])
            .then(function (answer) {

                var chosenItem;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].product_name === answer.choice) {
                        chosenItem = results[i];
                    }
                }

                if (chosenItem.stock_quantity >= parseInt(answer.quantity)) {

                    connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [
                            {
                                stock_quantity: chosenItem.stock_quantity - answer.quantity
                            },
                            {
                                item_id: chosenItem.item_id
                            }
                        ],
                        function (error) {
                            if (error) throw err;
                            console.log("You've placed an order! Your cost is $" + chosenItem.price * answer.quantity);
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
