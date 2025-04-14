// src/app.js
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.routes'); // ✅ make sure this is a function
const medRoutes = require('./routes/med.routes');   // ✅ same here

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/meds', medRoutes);

app.get('/', (req, res) => {
  res.send('Eldermed API is running 🚀');
});

module.exports = app;
