// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Updated CORS - Allow both local and live frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://apptitude-test-frontend.onrender.com'
  ],
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/test', require('./routes/test'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 INSABHI Server running on port ${PORT}`);
});