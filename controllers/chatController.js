// controllers/chatController.js
const db = require("../db");

exports.getMessages = (req, res) => {
    const { chatId } = req.params;
    const query = 'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC';
    db.query(query, [chatId], (err, results) => {
      if (err) {
        return res.status(500).send(err);
      }
      res.status(200).send(results);
    });
  };
  
exports.startChat = (req, res) => {
    const { user1_id, user2_id } = req.body;
  
    if (!user1_id || !user2_id) {
      return res.status(400).send("Both user IDs are required.");
    }
  
    const query = 'SELECT id FROM chats WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)';
    db.query(query, [user1_id, user2_id, user2_id, user1_id], (err, result) => {
      if (err) return res.status(500).send(err);
  
      if (result.length > 0) {
        res.status(200).send({ chatId: result[0].id });
      } else {
        const insertQuery = 'INSERT INTO chats (user1_id, user2_id) VALUES (?, ?)';
        db.query(insertQuery, [user1_id, user2_id], (err, result) => {
          if (err) return res.status(500).send(err);
          res.status(200).send({ chatId: result.insertId });
        });
      }
    });
  };
  
