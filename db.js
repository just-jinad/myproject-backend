// const mysql = require('mysql');

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'farmcon'
// });

// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err.stack);
//         return;
//     }
//     console.log('Connected to the database');
// });

// module.exports = db;


const mysql = require('mysql');

const db = mysql.createConnection({
  host: '64.62.151.106', 
  user: 'isaacjinad_farmcondb', 
  password: '###1234@aA', 
  database: 'isaacjinad_farmcondb', 
  port: 3306 
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the remote database:', err.stack);
    return;
  }
  console.log('Connected to the remote database!');
});

module.exports = db;



// Host
// localhost:3306
// Database name
// isaacjinad_farmcondb
// User name
// isaacjinad_farmcondb
// Password
// ******