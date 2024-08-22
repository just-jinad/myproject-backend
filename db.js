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

// Create a MySQL connection
const db_config = {
    host: '64.62.151.106', 
    user: 'isaacjinad_farmcondb', 
    password: '###1234@aA', 
    database: 'isaacjinad_farmcondb', 
    port: 3306 ,
    connectTimeout: 30000 
};

// Function to connect and handle reconnection
let db;

function handleDisconnect() {
    db = mysql.createConnection(db_config); // Recreate the connection
  

    db.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            setTimeout(handleDisconnect, 3000); // Wait 2 seconds before retrying the connection
        } else {
            console.log('Connected to the database!');
            setInterval(() => {
                db.query('SELECT 1');
            }, 60000);
        }
    });
        // MY NODE BACKEND
    // https://myproject-backend-voab.onrender.com/ 

    
    // Handle errors after the connection is established
    db.on('error', (err) => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect when the connection is lost
        } else {
            throw err;
        }
    });
}

// Call the function to establish the initial connection
handleDisconnect();

module.exports = db;



// Host
// localhost:3306
// Database name
// isaacjinad_farmcondb
// User name
// isaacjinad_farmcondb
// Password
// ******