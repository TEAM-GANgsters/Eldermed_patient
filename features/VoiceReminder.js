import React, { useState } from 'react';
import { translateText } from './translationService';

const VoiceReminder = () => {
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [reminderText, setReminderText] = useState('');

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' }
    ];

    const handleLanguageChange = async (e) => {
        const newLang = e.target.value;
        setSelectedLanguage(newLang);
        if (reminderText) {
            const translated = await translateText(reminderText, newLang);
            setReminderText(translated);
        }
    };

    return (
        <div className="voice-reminder-container">
            <select 
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="language-selector"
            >
                {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                        {lang.name}
                    </option>
                ))}
            </select>
            {/* Additional voice reminder functionality */}
        </div>
    );
};

export default VoiceReminder;
