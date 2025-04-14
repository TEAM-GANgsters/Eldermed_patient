const { translateText } = require('./translationService');

exports.processVoiceInput = async (audioBlob) => {
    try {
        // Convert audio to text using Web Speech API
        const text = await convertSpeechToText(audioBlob);
        return text;
    } catch (error) {
        console.error('Voice Processing Error:', error);
        throw new Error('Failed to process voice input');
    }
};

const convertSpeechToText = (audioBlob) => {
    return new Promise((resolve, reject) => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            resolve(text);
        };
        recognition.onerror = (error) => reject(error);
        recognition.start();
    });
};

exports.startVoiceRecording = () => {
    return navigator.mediaDevices.getUserMedia({ audio: true });
};
