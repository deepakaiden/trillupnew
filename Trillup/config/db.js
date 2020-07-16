const mysql = require("mysql");

// To establish connection MySql Server
let connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "trillup"
});

// To check weather connection established or not
connection.connect(function (error) {
    if (!error) {
        console.log("DB connection succeded.");
    } else {
        console.log("DB connection failed \n Error " + JSON.stringify(error, undefined, 2));
    }
});

module.exports = connection;