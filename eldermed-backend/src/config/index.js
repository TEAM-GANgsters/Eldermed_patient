require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/eldermed',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  jwtExpiration: '7d',
  
  // Twilio configuration for WhatsApp
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'your_twilio_account_sid',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'your_twilio_auth_token',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '+14155238886', // Default Twilio sandbox number
  },
  
  // Application settings
  app: {
    name: 'ElderMed Health App',
    apiPrefix: '/api/v1',
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  }
}; 