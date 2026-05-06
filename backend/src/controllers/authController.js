const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'Email already in use' });
    
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ message: 'Account created successfully', token, user });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.json({ message: 'Login successful', token, user });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name }, { new: true, runValidators: true });
    res.json({ message: 'Profile updated', user });
  } catch (err) { next(err); }
};
