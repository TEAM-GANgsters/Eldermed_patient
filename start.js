/**
 * ElderMed Integrated Project Starter
 * 
 * This script starts the frontend, backend, and chatbot servers.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Helper function to log with prefix
function logWithPrefix(prefix, message, color) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

// Check if the features directory needs package.json
const featuresDir = path.join(__dirname, 'features');
const featuresPackageJson = path.join(featuresDir, 'package.json');
if (!fs.existsSync(featuresPackageJson)) {
  logWithPrefix('SETUP', 'Creating package.json in features directory', colors.fg.blue);
  const featuresPackage = {
    "name": "features",
    "version": "1.0.0",
    "description": "Backend features for ElderMed",
    "main": "index.js",
    "dependencies": {
      "@google-cloud/translate": "^7.2.1",
      "axios": "^1.8.4",
      "node-nlp": "^4.27.0",
      "tesseract.js": "^5.0.3"
    }
  };
  fs.writeFileSync(featuresPackageJson, JSON.stringify(featuresPackage, null, 2));
  logWithPrefix('SETUP', 'Created package.json in features directory. Please run npm install in the features directory.', colors.fg.yellow);
}

// Check if .env file exists in eldermed-backend, if not create a template
const envPath = path.join(__dirname, 'eldermed-backend', '.env');
if (!fs.existsSync(envPath)) {
  const envTemplate = `PORT=5000
MONGO_URI=mongodb://localhost:27017/eldermed
GOOGLE_PROJECT_ID=dummy-project-id
GOOGLE_APP_CREDENTIALS=./google-credentials.json
OPENFDA_API_KEY=dummy-api-key
JWT_SECRET=your-secret-key-make-this-long-and-random-at-least-32-chars
`;
  fs.writeFileSync(envPath, envTemplate);
  logWithPrefix('SETUP', 'Created template .env file in eldermed-backend', colors.fg.blue);
  logWithPrefix('SETUP', 'Please update the .env file with your actual credentials', colors.fg.yellow);
}

// Check if required Python packages are installed for the chatbot
try {
  // Create a requirements file if it doesn't exist
  const chatbotDir = path.join(__dirname, 'Medical-Chatbot-GenAI-main');
  const requirementsPath = path.join(chatbotDir, 'additional_requirements.txt');
  if (!fs.existsSync(requirementsPath)) {
    fs.writeFileSync(requirementsPath, 'flask-cors==3.0.10\nflask==3.1.0\npython-dotenv==1.1.0\ngoogle-generativeai==0.3.1');
    logWithPrefix('SETUP', 'Created additional requirements file for the chatbot', colors.fg.blue);
    logWithPrefix('SETUP', 'Please run: pip install -r additional_requirements.txt in the Medical-Chatbot-GenAI-main directory', colors.fg.yellow);
  }
} catch (error) {
  logWithPrefix('ERROR', `Failed to check/create chatbot requirements: ${error.message}`, colors.fg.red);
}

// Start backend server
const backendDir = path.join(__dirname, 'eldermed-backend');
const backend = spawn('npm', ['run', 'dev'], { cwd: backendDir, shell: true });

backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    logWithPrefix('BACKEND', line, colors.fg.cyan);
  });
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    logWithPrefix('BACKEND', line, colors.fg.red);
  });
});

// Start frontend server
const frontendDir = path.join(__dirname, 'frontend');
const frontend = spawn('npm', ['run', 'dev'], { cwd: frontendDir, shell: true });

frontend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    logWithPrefix('FRONTEND', line, colors.fg.green);
  });
});

frontend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    logWithPrefix('FRONTEND', line, colors.fg.red);
  });
});

// Start chatbot server (Python)
const chatbotDir = path.join(__dirname, 'Medical-Chatbot-GenAI-main');
let chatbotProcess;

// Try running chatbot with venv activation
const isWindows = process.platform === 'win32';
let chatbotCommand;
let chatbotArgs;

if (isWindows) {
  // Windows activation
  chatbotCommand = 'cmd.exe';
  chatbotArgs = ['/c', `cd "${chatbotDir}" && .\\venv\\Scripts\\activate && python app_api.py`];
} else {
  // macOS/Linux activation
  chatbotCommand = 'bash';
  chatbotArgs = ['-c', `cd "${chatbotDir}" && source venv/bin/activate && python app_api.py`];
}

try {
  chatbotProcess = spawn(chatbotCommand, chatbotArgs, { shell: true });
  logWithPrefix('CHATBOT', 'Starting chatbot with virtual environment activation', colors.fg.magenta);
} catch (error) {
  logWithPrefix('ERROR', `Failed to start chatbot: ${error.message}`, colors.fg.red);
  logWithPrefix('CHATBOT', 'Please start the chatbot manually by running: source venv/bin/activate && python app_api.py in the Medical-Chatbot-GenAI-main directory', colors.fg.yellow);
}

if (chatbotProcess) {
  chatbotProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      logWithPrefix('CHATBOT', line, colors.fg.magenta);
    });
  });
  
  chatbotProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      logWithPrefix('CHATBOT', line, colors.fg.red);
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  logWithPrefix('SYSTEM', 'Shutting down servers...', colors.fg.yellow);
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  if (chatbotProcess) {
    chatbotProcess.kill('SIGINT');
  }
  process.exit(0);
});

logWithPrefix('SYSTEM', 'Starting ElderMed application...', colors.fg.magenta);
logWithPrefix('SYSTEM', 'Press Ctrl+C to stop all servers', colors.fg.yellow); 