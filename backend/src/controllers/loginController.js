import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Joi from 'joi';

// Joi schema for login
const loginSchema = Joi.object({
  phonenumber: Joi.string().required(),
  password: Joi.string().min(6).max(100).required()
});

export const loginController = async (req, res) => {
  try {
    console.log('Login request received:', { body: req.body, method: req.method, url: req.url });
    
    // Joi validation
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ message: error.details[0].message });
    }
    let { phonenumber, password } = value;
    // Basic input validation
    if (!phonenumber || !password) {
      return res.status(400).json({ message: 'Phone number and password are required.' });
    }
    // Sanitize input
    const phone = String(phonenumber).trim();
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Sign JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Return token and user info (excluding passwordHash)
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login controller error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 