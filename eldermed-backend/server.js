const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import services from the features directory using absolute paths
const featuresDir = path.resolve(__dirname, '..', 'features');
const ocrService = require(path.join(featuresDir, 'ocrService.js'));
const translationService = require(path.join(featuresDir, 'translationService.js'));
const nlpService = require(path.join(featuresDir, 'nlpService.js'));

// Destructure the services
const { extractTextFromImage, processScannedReminder } = ocrService;
const { translateText, getSupportedLanguages } = translationService;
const { parsePrescriptionText } = nlpService;

// Import original backend routes
const userRoutes = require('./src/routes/user.routes');
const medRoutes = require('./src/routes/med.routes');
const reminderRoutes = require('./src/routes/reminder.routes');

// Configuration
const PORT = process.env.PORT || 5000;
const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Middleware
// Configure CORS with specific options
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Original API routes
app.use('/api/users', userRoutes);
app.use('/api/meds', medRoutes);
app.use('/api/reminders', reminderRoutes);

// New routes for integrated services
// OCR Service Routes
app.post('/api/ocr/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    const imageBuffer = fs.readFileSync(req.file.path);
    const text = await extractTextFromImage(imageBuffer);
    
    return res.json({ text });
  } catch (error) {
    console.error('OCR Error:', error);
    return res.status(500).json({ error: error.message || 'OCR processing failed' });
  } finally {
    // Clean up the uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
});

app.post('/api/ocr/process-reminder', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    const imageBuffer = fs.readFileSync(req.file.path);
    const targetLanguage = req.body.targetLanguage || 'en';
    
    const text = await processScannedReminder(imageBuffer, targetLanguage);
    const parsedResult = await parsePrescriptionText(text);
    
    return res.json(parsedResult);
  } catch (error) {
    console.error('OCR Reminder Processing Error:', error);
    return res.status(500).json({ error: error.message || 'OCR reminder processing failed' });
  } finally {
    // Clean up the uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// Translation Service Routes
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided for translation' });
    }
    
    if (!targetLanguage) {
      return res.status(400).json({ error: 'No target language specified' });
    }
    
    const translation = await translateText(text, targetLanguage);
    return res.json({ translation });
  } catch (error) {
    console.error('Translation Error:', error);
    return res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

app.get('/api/translate/languages', async (req, res) => {
  try {
    const languages = await getSupportedLanguages();
    return res.json({ languages });
  } catch (error) {
    console.error('Get Languages Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch supported languages' });
  }
});

// NLP Service Routes
app.post('/api/nlp/parse', async (req, res) => {
  try {
    const { text, language } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided for parsing' });
    }
    
    const parsedResult = await parsePrescriptionText(text);
    return res.json(parsedResult);
  } catch (error) {
    console.error('NLP Error:', error);
    return res.status(500).json({ error: error.message || 'NLP parsing failed' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Eldermed Integrated API is running 🚀');
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`🚀 Integrated Server is running on http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

// Start the reminder scheduler
require('./src/schedulers/reminderScheduler');

module.exports = app; 