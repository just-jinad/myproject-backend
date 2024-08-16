const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).send('A token is required for authentication');
  }

  const token = authHeader.split(' ')[1];
  console.log('Token:', token); // Debug statement

  if (!token) {
    return res.status(403).send('Invalid token format');
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret_key'); 
    req.userId = decoded.id; 
    console.log('Decoded Token:', decoded); // Debug statement

    console.log(`User ID extracted: ${req.userId}`); 

    next();
  } catch (err) {
    return res.status(401).send('Invalid Token');
  }
};

module.exports = verifyToken;
