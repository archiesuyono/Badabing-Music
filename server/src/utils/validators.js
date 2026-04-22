const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Minimal 6 characters
  return password && password.length >= 6;
};

const validateUsername = (username) => {
  // Alphanumeric and underscore only, 3-20 characters
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

const sanitizeUser = (user) => {
  const { password, verificationToken, ...rest } = user.toJSON();
  return rest;
};

const sanitizePlaylist = (playlist) => {
  return playlist.toJSON();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  sanitizeUser,
  sanitizePlaylist
};
