const { Translate } = require('@google-cloud/translate').v2;
const fs = require('fs');
const path = require('path');

// Check if credentials file exists
const credentialsFile = process.env.GOOGLE_APP_CREDENTIALS;
const credentialsExist = credentialsFile && fs.existsSync(credentialsFile);

// Initialize Translation Client conditionally
let translate = null;
try {
    if (credentialsExist) {
        translate = new Translate({
            projectId: process.env.GOOGLE_PROJECT_ID,
            keyFilename: process.env.GOOGLE_APP_CREDENTIALS
        });
        console.log("Google Translation API initialized successfully");
    } else {
        console.log("Missing Google Cloud credentials, translation service will use text fallback mode");
    }
} catch (error) {
    console.error("Failed to initialize Google Translation API:", error.message);
}

/**
 * Translates text to the target language.
 * @param {string} text The text to translate.
 * @param {string} targetLanguage The target language code (e.g., 'es', 'fr').
 * @returns {Promise<string>} The translated text.
 */
exports.translateText = async (text, targetLanguage) => {
    if (!text || !targetLanguage || targetLanguage === 'en') {
        return text;
    }

    // If translation client isn't initialized, return original text
    if (!translate) {
        console.log(`Translation service in fallback mode. Returning original text for language: ${targetLanguage}`);
        return `[Translation to ${targetLanguage} is unavailable: ${text}]`;
    }

    try {
        const [translation] = await translate.translate(text, targetLanguage);
        console.log(`Translation result: ${translation}`);
        return translation;
    } catch (error) {
        console.error('Translation Service Error:', error);
        // Return gracefully formatted text instead of throwing
        return `[Translation error: ${text}]`;
    }
};

exports.translateVoiceReminder = async (audioBlob, targetLanguage) => {
    if (!audioBlob || !targetLanguage || targetLanguage === 'en') {
        return audioBlob;
    }

    // Voice translation is more complex - return original for now
    if (!translate) {
        return audioBlob;
    }

    try {
        console.log(`Processing voice reminder translation to ${targetLanguage}`);
        // Add voice translation implementation here
        return audioBlob;
    } catch (error) {
        console.error('Voice Translation Error:', error);
        return audioBlob;
    }
};

exports.getSupportedLanguages = async () => {
    // Provide a fallback list if translation client isn't initialized
    if (!translate) {
        return [
            { code: 'en', name: 'English' },
            { code: 'hi', name: 'Hindi' },
            { code: 'bn', name: 'Bengali' },
            { code: 'te', name: 'Telugu' },
            { code: 'mr', name: 'Marathi' },
            { code: 'ta', name: 'Tamil' },
            { code: 'ur', name: 'Urdu' },
            { code: 'gu', name: 'Gujarati' },
            { code: 'kn', name: 'Kannada' },
            { code: 'ml', name: 'Malayalam' },
            { code: 'pa', name: 'Punjabi' }
        ];
    }

    try {
        const [languages] = await translate.getLanguages();
        return languages;
    } catch (error) {
        console.error('Error fetching supported languages:', error);
        // Return a fallback list of languages
        return [
            { code: 'en', name: 'English' },
            { code: 'hi', name: 'Hindi' },
            { code: 'bn', name: 'Bengali' },
            { code: 'te', name: 'Telugu' },
            { code: 'mr', name: 'Marathi' }
        ];
    }
};