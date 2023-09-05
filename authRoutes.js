const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

//UserModel
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  gender: String,
  country: String
}, { versionKey: false });

const User = mongoose.model("users", userSchema);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, gender, country } = req.body;

    const emailExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ username });

    if (emailExists) {
      return res.status(409).json({ error: 'This email is used already' });
    }

    if (usernameExists) {
      return res.status(409).json({ error: 'This username has been taken before' });
    }

    const hashPassword = await bcrypt.hash(password, 2);

    const newUser = new User({
      username,
      email,
      password: hashPassword,
      gender,
      country
    });

    const result = await newUser.save();

    // Sending confirmation email using Gmail
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'davidkulmohammad@gmail.com', // Your Gmail email
        pass: 'owzimcgudhfhnmbj', // The generated app password or your Gmail account password
      },
    });

    const mailOptions = {
      from: 'davidkulmohammad@gmail.com',
      to: email,
      subject: 'Registration Confirmation',
      html: `
        <h2>Thank you for registering, ${result.username}!</h2>
        <p>I hope you enjoy my TodoApp!</p>
        <p>My greatest honor, Dave.</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email sending error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const {email, password, rememberMe} = req.body;

  const user = await User.findOne({email});

  if (!user) {
    return res.status(409).json({ error: 'This email is not registered' });
  }

  const validPassword = await bcrypt.compare(password, user.password)

  if (!validPassword) {
    return res.status(409).json({error: "Incorrect password"});
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? "3d" : "3h", 
  });

  res.cookie("token", token, {
    httpOnly: true, 
    secure: true, 
    sameSite: "strict", 
    maxAge: rememberMe ? 3 * 24 * 60 * 60 * 1000 : 3 * 60 * 60 * 1000, 
  });
  
  return res.json({message: "Successfully logged in", id: user._id})
})


// VERIFY TOKEN
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user information to req.user
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};


//GET
router.get('/user', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you're storing the user ID in req.user after JWT verification

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      username: user.username,
      gender: user.gender,
      country: user.country,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




//Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token'); // Clear the token cookie
  res.status(200).json({ message: 'Logout successful' });
});


module.exports = router;
