import React, { useState, useEffect } from 'react';
import { useTranslation } from './TranslationProvider';

interface TranslatableTextProps {
  children: string;
  className?: string;
  fallback?: string; // Optional fallback text if translation fails
}

const TranslatableText: React.FC<TranslatableTextProps> = ({ 
  children, 
  className,
  fallback 
}) => {
  const { currentLanguage, translate, isTranslating } = useTranslation();
  const [translatedText, setTranslatedText] = useState(children);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    setError(false);
    
    const updateTranslation = async () => {
      if (currentLanguage !== 'en') {
        setIsLoading(true);
        try {
          const result = await translate(children);
          if (isMounted) {
            setTranslatedText(result || children);
            setError(!result || result === children);
          }
        } catch (err) {
          console.error('Translation error in component:', err);
          if (isMounted) {
            setError(true);
            setTranslatedText(fallback || children);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      } else {
        setTranslatedText(children);
        setIsLoading(false);
      }
    };
    
    updateTranslation();
    
    return () => {
      isMounted = false;
    };
  }, [children, currentLanguage, translate, fallback]);
  
  // Handle very short loading times to avoid flickering
  if (isLoading && translatedText === children) {
    return <span className={className}>{children}</span>;
  }
  
  return <span className={className}>{translatedText}</span>;
};

export default TranslatableText; 