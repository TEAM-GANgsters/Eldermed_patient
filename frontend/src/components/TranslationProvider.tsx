import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translationService } from '@/lib/integratedServices';

interface Language {
  code: string;
  name: string;
}

interface TranslationContextType {
  currentLanguage: string;
  setLanguage: (code: string) => void;
  translate: (text: string) => Promise<string>;
  languages: Language[];
  isTranslating: boolean;
}

const defaultLanguages: Language[] = [
  { code: 'en', name: 'English' },
  // Indian languages
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ur', name: 'Urdu' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'or', name: 'Odia' },
  { code: 'as', name: 'Assamese' },
  { code: 'ks', name: 'Kashmiri' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'ne', name: 'Nepali' },
  { code: 'doi', name: 'Dogri' },
  { code: 'kok', name: 'Konkani' },
  { code: 'mai', name: 'Maithili' },
  { code: 'bho', name: 'Bhojpuri' },
  { code: 'sat', name: 'Santali' },
  { code: 'lus', name: 'Mizo' }
];

const TranslationContext = createContext<TranslationContextType>({
  currentLanguage: 'en',
  setLanguage: () => {},
  translate: async (text) => text,
  languages: defaultLanguages,
  isTranslating: false
});

export const useTranslation = () => useContext(TranslationContext);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [languages, setLanguages] = useState<Language[]>(defaultLanguages);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});

  // Fetch supported languages when component mounts
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const supportedLanguages = await translationService.getSupportedLanguages();
        if (supportedLanguages && supportedLanguages.length > 0) {
          setLanguages(supportedLanguages);
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
        // Keep using default languages
      }
    };
    
    fetchLanguages();
  }, []);

  // Function to set the current language
  const setLanguage = (code: string) => {
    if (code !== currentLanguage) {
      setCurrentLanguage(code);
      
      // Translate the entire page if not switching to English
      if (code !== 'en') {
        translatePage(code);
      }
      
      // Save preference to localStorage
      localStorage.setItem('preferredLanguage', code);
    }
  };

  // Function to translate text
  const translate = async (text: string): Promise<string> => {
    if (!text || currentLanguage === 'en') {
      return text;
    }
    
    // Check if we already have this translation cached
    if (translations[currentLanguage]?.[text]) {
      return translations[currentLanguage][text];
    }
    
    setIsTranslating(true);
    try {
      const translated = await translationService.translateText(text, currentLanguage);
      
      // Only store valid translations
      if (translated && translated !== text) {
        // Cache the translation
        setTranslations(prev => ({
          ...prev,
          [currentLanguage]: {
            ...(prev[currentLanguage] || {}),
            [text]: translated
          }
        }));
        
        return translated;
      } else {
        console.warn('Translation returned empty or same text:', text);
        return text;
      }
    } catch (error) {
      console.error('Translation error:', error);
      
      // We'll still try to show some content even if translation fails
      // In the case of commonly used UI strings, we could add fallback translations
      const fallbackTranslations: Record<string, Record<string, string>> = {
        'hi': {
          'Back': 'वापस',
          'Submit': 'जमा करें',
          'Cancel': 'रद्द करें',
          'Save': 'सहेजें',
          'Delete': 'हटाएं',
          'Next': 'अगला',
          'Previous': 'पिछला',
          'Loading...': 'लोड हो रहा है...',
          'Medication Reminders': 'दवा अनुस्मारक',
          'Add Reminder': 'अनुस्मारक जोड़ें',
          'WhatsApp Alert': 'व्हाट्सएप सूचना',
          'Phone Number': 'फ़ोन नंबर',
          'All': 'सभी',
          'Morning': 'सुबह',
          'Afternoon': 'दोपहर',
          'Evening': 'शाम',
          'Error': 'त्रुटि',
          'Success': 'सफलता'
        }
      };
      
      // Return fallback translation if available
      if (fallbackTranslations[currentLanguage]?.[text]) {
        return fallbackTranslations[currentLanguage][text];
      }
      
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  // Function to translate the entire page
  const translatePage = async (targetLanguage: string) => {
    setIsTranslating(true);
    
    try {
      // This is a placeholder for whole page translation
      // In a real implementation, you would:
      // 1. Find all text elements in the DOM
      // 2. Replace their content with translated versions
      // 3. Update state to re-render components with translated text
      
      // As a simple example, we could translate the page title
      const originalTitle = document.title;
      const translatedTitle = await translationService.translateText(originalTitle, targetLanguage);
      document.title = translatedTitle;
      
      // You could also translate static text in the application
      // This requires a more complex implementation with a translation map
    } catch (error) {
      console.error('Page translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Check for saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  return (
    <TranslationContext.Provider value={{ 
      currentLanguage, 
      setLanguage, 
      translate, 
      languages,
      isTranslating
    }}>
      {isTranslating && (
        <div className="fixed top-0 left-0 right-0 bg-medical-teal text-white text-center py-1 text-xs z-50">
          Translating...
        </div>
      )}
      {children}
    </TranslationContext.Provider>
  );
};

// Add default export
export default TranslationProvider; 