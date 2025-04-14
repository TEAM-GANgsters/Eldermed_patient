const Tesseract = require('tesseract.js');
const { translateText } = require('./translationService');

// Initialize the Tesseract worker
// It's often better to create the worker once and reuse it,
// but for simplicity in this service, we create it on demand.
// Consider moving worker creation/management outside if performance is critical.
async function initializeWorker() {
    // Tesseract.js v5+ uses createWorker
    // Specify the language(s) needed - 'eng' for English
    const worker = await Tesseract.createWorker('eng', 1, {
        // logger: m => console.log(m) // Optional: for detailed logging
    });
    return worker;
}

/**
 * Extracts text from an image buffer using Tesseract.js.
 * @param {Buffer} imageBuffer - The buffer containing the image data.
 * @returns {Promise<string>} - A promise that resolves with the extracted text.
 */
exports.extractTextFromImage = async (imageBuffer) => {
    let worker;
    try {
        console.log('Initializing Tesseract worker...');
        worker = await initializeWorker();
        console.log('Performing OCR...');
        const { data: { text } } = await worker.recognize(imageBuffer);
        console.log('OCR finished.');
        return text;
    } catch (error) {
        console.error('Tesseract OCR Error:', error);
        throw new Error('Failed to perform OCR on the image.');
    } finally {
        // Terminate the worker to free up resources
        if (worker) {
            console.log('Terminating Tesseract worker...');
            await worker.terminate();
        }
    }
};

exports.processScannedReminder = async (image, targetLanguage = 'en') => {
    try {
        // Process the scanned image
        const extractedText = await exports.extractTextFromImage(image);
        
        // Translate if necessary
        if (targetLanguage !== 'en') {
            return await translateText(extractedText, targetLanguage);
        }
        
        return extractedText;
    } catch (error) {
        console.error('Scanned Reminder Processing Error:', error);
        throw new Error('Failed to process scanned reminder');
    }
};
