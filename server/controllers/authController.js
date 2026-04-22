const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { hashPassword, comparePassword, generateToken } = require('../helpers/authUtils');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
exports.register = async (req, res, next) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingUsername = await User.findOne({
      where: { username }
    });

    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      isVerified: true // Auto-verify for now, in production use email verification
    });

    // Generate token
    const token = generateToken(jwt, user.id, user.email, user.username);

    res.status(201).json({
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(jwt, user.id, user.email, user.username);

    res.json({
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth
exports.googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    console.log('🔐 Verifying Google token...');
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log(`✅ Google token verified for: ${email}`);

    let user = await User.findOne({
      where: { email }
    });

    if (!user) {
      // Create new user from Google data
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      console.log(`📝 Creating new user: ${email}`);

      user = await User.create({
        googleId,
        email,
        username: email.split('@')[0] + '_' + googleId.slice(-6),
        firstName,
        lastName: lastName || null,
        profileImage: picture,
        isVerified: true
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      console.log(`🔗 Linking Google account to existing user: ${email}`);
      user.googleId = googleId;
      user.profileImage = picture;
      await user.save();
    } else {
      console.log(`✨ User already linked: ${email}`);
    }

    const jwtToken = generateToken(jwt, user.id, user.email, user.username);

    res.json({
      message: 'Google login successful',
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage
        }
      }
    });
  } catch (error) {
    console.error('❌ Google authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired Google token' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, profileImage } = req.body;

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    next(error);
  }
};
