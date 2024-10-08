const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
const path = require("path");
const multer = require("multer");
const cloudinary = require("../cloudinaryConfig");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    format: async (req, file) => "jpg", // supports promises as well
    public_id: (req, file) => Date.now() + path.extname(file.originalname),
  },
});

const upload = multer({ storage: storage });

// FUNCTION TO SIGNUP
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

// FUNCTION TO LOGIN
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
    const user_id = user.user_id;
    console.log(user_id);

    console.log("this is the token from frontend:", token);
    res.status(200).json({ token, user_id });
  });
};

// FUNCTION TO UPLOAD PRODUCT

exports.upload = upload;
exports.uploadProduct = (req, res) => {
  const {
    productName,
    productDescription,
    category,
    price,
    availability,
    unitPrice,
    minimumOrder,
    location,
  } = req.body;
  const files = req.files; // Array of files
  const userId = req.userId; // Extracted from JWT token

  if (!files || files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  const imagePaths = files.map((file) => file.path); // Get the paths of all uploaded files

  const sql =
    "INSERT INTO `products`( `productName`, `productDescription`, `category`, `price`, `availability`, `unitPrice`, `minimumOrder`, `location`, `imagePath`, `user_id`) VALUES (?,?,?,?,?,?,?,?,?,?)";

  db.query(
    sql,
    [
      productName,
      productDescription,
      category,
      price,
      availability,
      unitPrice,
      minimumOrder,
      location,
      JSON.stringify(imagePaths), // Store paths as a JSON string
      userId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error uploading product:", err);
        return res.status(500).send("Failed to upload product");
      }
      res
        .status(200)
        .send({ message: "Product uploaded successfully", status: 200 });
    }
  );
};

// FUNCTION TO GET ALL USER PRODUCT
exports.getUserProducts = (req, res) => {
  const userId = req.userId;
  console.log(userId);

  const sql = `
  SELECT p.*, u.profilePicture, u.first_name, u.bio, u.location 
  FROM farmcon_user u
  LEFT JOIN products p ON p.user_id = u.user_id
  WHERE u.user_id = ?
`;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user products and profile:", err);
      return res.status(500).send("Failed to fetch user products and profile");
    }
    res.status(200).json(results);
  });
};

// FUNCTION TO GET ALL PRODUCT
exports.getAllProducts = (req, res) => {
  const sql =
    "SELECT products.*, farmcon_user.phone_number FROM products JOIN farmcon_user ON products.user_id = farmcon_user.user_id;";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching all products:", err);
      return res.status(500).send("Failed to fetch all products");
    }
    res.status(200).json(results);
  });
};

    // FUNCTION TO GET PRODUCT DETAILS
exports.getProductsDetail = (req, res) => {
  const { id } = req.params;
  
  // Assuming you're using a database query to fetch product details
  const sql = 'SELECT * FROM products WHERE product_id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error fetching product details:', err);
      return res.status(500).send('Failed to fetch product details');
    }
    if (result.length === 0) {
      return res.status(404).send('Product not found');
    }
    res.status(200).json(result[0]);
  });
};


exports.updateUserProfile = (req, res) => {
  const userId = req.userId;
  const { bio, location, profilePicture } = req.body;

  const sql = `
    UPDATE farmcon_user
    SET bio = ?, location = ?, profilePicture = ?
    WHERE user_id = ?
  `;

  db.query(sql, [bio, location, profilePicture, userId], (err, result) => {
    if (err) {
      console.error("Error updating profile:", err);
      return res.status(500).send("Failed to update profile");
    }
    res.status(200).send("Profile updated successfully");
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
