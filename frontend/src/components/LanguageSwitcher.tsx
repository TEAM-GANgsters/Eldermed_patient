import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from './TranslationProvider';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const LanguageSwitcher = () => {
  const { currentLanguage, setLanguage, languages } = useTranslation();
  
  // Get current language name
  const currentLanguageName = languages.find(lang => lang.code === currentLanguage)?.name || 'English';

  return (
    <div className="fixed top-4 right-4 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 rounded-full px-2 gap-1">
            <Globe className="h-4 w-4" />
            <span className="ml-1 text-xs">{currentLanguageName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="h-[250px] overflow-y-auto">
          {languages.map(language => (
            <DropdownMenuItem 
              key={language.code}
              onClick={() => setLanguage(language.code)}
              className={currentLanguage === language.code ? 'bg-accent font-medium' : ''}
            >
              {language.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageSwitcher; 