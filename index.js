// backend/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const authRoutes = require('./authRoutes');
const userRoutes = require("./userRoutes")
const path = require('path');
const cookieParser = require("cookie-parser");
require("dotenv").config();


const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());

app.use(cors({
  origin: ["https://todo-app-pied-nine.vercel.app"],
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true
}));

app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/user', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});