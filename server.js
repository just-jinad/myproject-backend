const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const authControllers = require("./controllers/authControllers");
const chatControllers = require("./controllers/chatController");
const verifyToken = require("./middlewares/authMiddleware");
const db = require("./db");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 8888;

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => res.json("Welcome to the backend page"));

app.post("/register", authControllers.register);
app.post("/login", authControllers.login);
app.post("/upload", verifyToken, authControllers.upload.single("file"), authControllers.uploadProduct);
app.get("/user/products", verifyToken, authControllers.getUserProducts);
app.get("/products", verifyToken, authControllers.getAllProducts);
app.post("/forgot-password", authControllers.forgotPassword);

app.post('/startChat', chatControllers.startChat);
app.get('/messages/:chatId', chatControllers.getMessages);

app.post('/translate', (req, res) => {
  const { keys, language } = req.body;
  if (!keys || !language) {
    return res.status(400).json({ error: 'Keys and language are required' });
  }

  const translatedTexts = keys.reduce((acc, key) => {
    acc[key] = translations[key] ? translations[key][language] || translations[key].en : key;
    return acc;
  }, {});

  res.json(translatedTexts);
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("joinChat", ({ chatId }) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on("sendMessage", (msg) => {
    const { chatId, senderId, content } = msg;

    console.log(`Message received from ${senderId} in chat ${chatId}: ${content}`);

    const query = 'INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)';
    db.query(query, [chatId, senderId, content], (err) => {
      if (err) {
        console.error("Error saving message to the database:", err);
        return;
      }

      io.to(chatId).emit("receiveMessage", {
        chatId,
        senderId,
        content,
        created_at: new Date(),
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
