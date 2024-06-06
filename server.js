const express = require('express')
const app = express()
const cors = require('cors')
const port = 8888
const  authControllers = require('./controllers/authControllers')

app.use(cors())
app.use(express.json())
app.get('/', (req, res)=>{
    return res.json("Welcome to the backend page")
})

app.post('/register', authControllers.register);
app.post('/login', authControllers.login);
app.listen(port, ()=>{
    console.log("Lift up, app is working");
})