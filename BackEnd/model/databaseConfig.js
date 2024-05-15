

const mysql = require("mysql");

var dbconnect = {
  getConnection: function () {

    var conn = mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '12345',
      database: 'store',
    });

    return conn;
  }
};

module.exports = dbconnect;
