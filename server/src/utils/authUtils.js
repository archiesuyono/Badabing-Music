const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const generateToken = (jwt, userId, email, username) => {
  return jwt.sign(
    { userId, email, username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateRefreshToken = (jwt, userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken
};
