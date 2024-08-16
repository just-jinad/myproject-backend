const express = require("express");
const app = express();
const cors = require("cors");
const port = 8888;
const authControllers = require("./controllers/authControllers");
const verifyToken = require("./middlewares/authMiddleware");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const translations  = require('./translation')

// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  return res.json("Welcome to the backend page");
});

app.post("/register", authControllers.register);
app.post("/login", authControllers.login);
app.post(
  "/upload",
  verifyToken,
  authControllers.upload.single("file"),
  authControllers.uploadProduct
);
app.get("/user/products", verifyToken, authControllers.getUserProducts);
app.get("/products", verifyToken, authControllers.getAllProducts);

app.post("/forgot-password", authControllers.forgotPassword);


app.post('/translate', (req, res) => {
  const { keys, language } = req.body;

  if (!keys || !language) {
    return res.status(400).json({ error: 'Keys and language are required' });
  }

  // Fetch translations
  const translatedTexts = keys.reduce((acc, key) => {
    acc[key] = translations[key] ? translations[key][language] || translations[key].en : key;
    return acc;
  }, {});

  res.json(translatedTexts);
});

app.listen(port, () => {
  console.log("Lift up, app is working");
});

