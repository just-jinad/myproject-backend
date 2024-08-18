const db = require("../db");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
const cloudinary = require('../cloudinaryConfig');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    format: async (req, file) => 'jpg', // supports promises as well
    public_id: (req, file) => Date.now() + path.extname(file.originalname),
  },
});

const upload = multer({ storage: storage });

exports.register = async (req, res) => {
  const { first_name, last_name, email, address, phone_number, password } =
    req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql =
    "INSERT INTO `farmcon_user`(`first_name`, `last_name`, `email`, `address`, `phone_number`, `password`) VALUES (?,?,?,?,?,?)";
  db.query(
    sql,
    [first_name, last_name, email, address, phone_number, hashedPassword],
    (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        return res.status(500).send("Failed to register user");
      }
      res.status(200).send("User registered");
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM `farmcon_user` WHERE `email` = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).send("Failed to login");
    }
    if (results.length === 0) {
      return res.status(400).send("User not found");
    }

    const user = results[0];
    console.log("User from database:", user); // Debug log
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).send("Incorrect password");
    }

    // JWT token generation
    const token = jwt.sign({ id: user.user_id }, "your_jwt_secret_key", {
      expiresIn: "1h",
    });
    const user_id  = user.user_id
    console.log(user_id);
    
    console.log("this is the token from frontend:", token);
    res.status(200).json({ token, user_id});
  });
};

exports.uploadProduct = (req, res) => {
  const {
    productName,
    productDescription,
    category,
    price,
    availability,
    location,
  } = req.body;
  const file = req.file;
  const userId = req.userId; // This is extracted from JWT token

  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  const sql =
    "INSERT INTO `products`( `productName`, `productDescription`, `category`, `price`, `availability`, `location`, `imagePath`, `user_id`) VALUES (?,?,?,?,?,?,?,?)";
  db.query(
    sql,
    [
      productName,
      productDescription,
      category,
      price,
      availability,
      location,
      file.path, // Cloudinary URL
      userId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error uploading product:", err);
        return res.status(500).send("Failed to upload product");
      }
      res.status(200).send({message: "Product uploaded successfully",});
    }
  );
};

exports.upload = upload;

exports.getUserProducts = (req, res) => {
  const userId = req.userId; 

  const sql = "SELECT * FROM `products` WHERE `user_id` = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user products:", err);
      return res.status(500).send("Failed to fetch user products");
    }
    res.status(200).json(results);
  });
};


exports.getAllProducts = (req, res) => {
  const sql = "SELECT * FROM `products`";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching all products:", err);
      return res.status(500).send("Failed to fetch all products");
    }
    res.status(200).json(results);
  });
};



exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  const sql = "SELECT * FROM `farmcon_user` WHERE `email` = ?";

  db.query(sql, [email], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Email not found" });
    }

    const user = results[0];
    console.log(user.email);
    const token = jwt.sign({ id: user.user_id }, "your_jwt_secret_key", {
      expiresIn: "1h",
    });
    const resetLink = `http://yourfrontend.com/reset-password?token=${token}`;

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    var mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      text: `Hello, ${user.first_name}.\n\nYou requested for a password reset. Please click on the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nYour Team`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).send("Email has been sent successfully");
      }
    });
  });
};



