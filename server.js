const express = require('express')
const app = express()
const cors = require('cors')
const port = 8888
const db = require('./db')
const bcrypt = require('bcryptjs')

app.use(cors())
app.use(express.json())
app.get('/', (req, res)=>{
    return res.json("Welcome to the backend page")
})

app.post('/register',  async  (req, res) => {
    const { first_name, last_name, email, address, phone_number, password } = req.body;
    // console.log(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO `farmcon_user`(`first_name`, `last_name`, `email`, `address`, `phone_number`, `password`) VALUES (?,?,?,?,?,?)';
    db.query(sql, [first_name, last_name, email, address,phone_number, hashedPassword], (err, result) => {
        if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).send('Failed to register user');
        }
        res.status(200).send('User registered');
    });
})

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM `farmcon_user` WHERE `email` = ?';

    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Failed to login');
        }
        if (results.length === 0) {
            return res.status(400).send('User not found');
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).send('Incorrect password');
        }

        res.status(200).send('Login successful');
    });
});
app.listen(port, ()=>{
    console.log("Lift up, app is working");
})