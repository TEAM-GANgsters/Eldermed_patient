import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Globe, History, Copy, Check, ArrowRightLeft, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediCard from "@/components/MediCard";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import TranslatableText from "@/components/TranslatableText";
import { useTranslation } from "@/components/TranslationProvider";
import { translationService } from "@/lib/integratedServices";
import { initSpeechRecognition } from "@/utils/speechRecognition";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// History item type
interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: Date;
}

const Translation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { languages } = useTranslation();
  
  // Text states
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  
  // Language states
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("hi");
  
  // UI states
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [recognitionRef, setRecognitionRef] = useState<SpeechRecognitionInterface | null>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    const recognition = initSpeechRecognition();
    if (recognition) {
      // Handle recognition results
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSourceText(transcript);
        stopListening();
        
        // Auto translate after voice input
        handleTranslate(transcript);
      };
      
      // Handle errors
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
        toast({
          title: "Voice Recognition Error",
          description: `Error: ${event.error}. Please try again or type manually.`,
          variant: "destructive",
        });
      };
      
      // Handle end of speech
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setRecognitionRef(recognition);
    }
    
    return () => {
      if (recognitionRef) {
        try {
          recognitionRef.abort();
        } catch (e) {
          console.error('Error aborting speech recognition:', e);
        }
      }
    };
  }, [toast]);
  
  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('translationHistory');
    if (savedHistory) {
      try {
        // Parse the saved history and ensure proper Date objects
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(parsedHistory);
      } catch (error) {
        console.error('Error parsing translation history:', error);
      }
    }
  }, []);
  
  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('translationHistory', JSON.stringify(history));
    }
  }, [history]);
  
  const handleSourceLanguageChange = (value: string) => {
    setSourceLanguage(value);
  };
  
  const handleTargetLanguageChange = (value: string) => {
    setTargetLanguage(value);
  };
  
  const swapLanguages = () => {
    // Swap the languages
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    
    // Also swap the text if there's translated text
    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };
  
  const handleTranslate = async (text?: string) => {
    const textToTranslate = text || sourceText;
    if (!textToTranslate.trim()) {
      toast({
        description: "Please enter some text to translate",
        variant: "destructive",
      });
      return;
    }
    
    setIsTranslating(true);
    
    try {
      const result = await translationService.translateText(
        textToTranslate,
        targetLanguage,
        sourceLanguage
      );
      
      setTranslatedText(result);
      
      // Add to history
      if (result && result !== textToTranslate) {
        const newHistoryItem: HistoryItem = {
          id: Date.now().toString(),
          sourceText: textToTranslate,
          translatedText: result,
          sourceLanguage,
          targetLanguage,
          timestamp: new Date()
        };
        
        // Add to history, keeping only the latest 10 items
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation Error",
        description: "Failed to translate text. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };
  
  const copyToClipboard = async () => {
    if (!translatedText) return;
    
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      
      toast({
        description: "Copied to clipboard",
        className: "bg-medical-teal text-white",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  const loadFromHistory = (item: HistoryItem) => {
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    setSourceLanguage(item.sourceLanguage);
    setTargetLanguage(item.targetLanguage);
    setShowHistory(false);
  };
  
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('translationHistory');
    toast({
      description: "Translation history cleared",
      className: "bg-slate-700 text-white",
    });
  };
  
  const toggleListening = () => {
    if (!recognitionRef) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support voice input. Please type your text instead.",
        variant: "destructive"
      });
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const startListening = () => {
    try {
      recognitionRef?.start();
      setIsListening(true);
      toast({
        description: "Listening... Speak clearly.",
        className: "bg-medical-teal text-white",
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
    }
  };
  
  const stopListening = () => {
    try {
      recognitionRef?.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  };
  
  const goBack = () => navigate(-1);
  
  return (
    <div className="min-h-screen pb-20">
      <header className="flex justify-between items-center p-4 border-b">
        <Button variant="ghost" onClick={goBack}>
          <ArrowUp className="w-5 h-5 transform -rotate-90" />
          <span className="ml-2"><TranslatableText>Back</TranslatableText></span>
        </Button>
        <h1 className="text-xl font-bold">
          <TranslatableText>Translation Tool</TranslatableText>
        </h1>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setShowHistory(!showHistory)}
          className="relative"
        >
          <History className="w-5 h-5" />
          {history.length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-medical-teal text-white rounded-full text-xs flex items-center justify-center">
              {history.length}
            </span>
          )}
        </Button>
      </header>
      
      <div className="container max-w-4xl mx-auto p-4">
        {showHistory ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">
                <TranslatableText>Translation History</TranslatableText>
              </h2>
              {history.length > 0 && (
                <Button variant="destructive" size="sm" onClick={clearHistory}>
                  <TranslatableText>Clear History</TranslatableText>
                </Button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1"><TranslatableText>No history</TranslatableText></h3>
                <p className="text-muted-foreground">
                  <TranslatableText>Your translation history will appear here</TranslatableText>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(item => (
                  <MediCard 
                    key={item.id} 
                    neumorphic 
                    className="p-4 cursor-pointer transition-all hover:shadow-lg"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center">
                          <span className="font-medium">
                            {languages.find(l => l.code === item.sourceLanguage)?.name || item.sourceLanguage}
                          </span>
                          <ArrowRightLeft className="w-4 h-4 mx-2" />
                          <span className="font-medium">
                            {languages.find(l => l.code === item.targetLanguage)?.name || item.targetLanguage}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm truncate">{item.sourceText}</p>
                      <p className="text-sm font-medium text-medical-teal truncate">{item.translatedText}</p>
                    </div>
                  </MediCard>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label htmlFor="sourceLanguage" className="block text-sm font-medium">
                    <TranslatableText>From</TranslatableText>
                  </label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={toggleListening}
                    disabled={isTranslating}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 mr-1 text-red-500" />
                    ) : (
                      <Mic className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs">
                      {isListening ? 
                        <TranslatableText>Stop</TranslatableText> : 
                        <TranslatableText>Speak</TranslatableText>
                      }
                    </span>
                  </Button>
                </div>
                <Select value={sourceLanguage} onValueChange={handleSourceLanguageChange} name="sourceLanguage">
                  <SelectTrigger id="sourceLanguage" className="w-full mb-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={`source-${lang.code}`} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Enter text to translate"}
                  className="h-40 resize-none"
                  disabled={isListening}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label htmlFor="targetLanguage" className="block text-sm font-medium">
                    <TranslatableText>To</TranslatableText>
                  </label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={copyToClipboard}
                    disabled={!translatedText}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs">
                      {copied ? 
                        <TranslatableText>Copied</TranslatableText> : 
                        <TranslatableText>Copy</TranslatableText>
                      }
                    </span>
                  </Button>
                </div>
                <Select value={targetLanguage} onValueChange={handleTargetLanguageChange} name="targetLanguage">
                  <SelectTrigger id="targetLanguage" className="w-full mb-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={`target-${lang.code}`} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={translatedText}
                  readOnly
                  placeholder="Translation will appear here"
                  className="h-40 resize-none"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 justify-center">
              <Button 
                variant="outline" 
                size="icon"
                onClick={swapLanguages}
                className="rounded-full h-10 w-10"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </Button>
              
              <Button 
                onClick={() => handleTranslate()}
                disabled={isTranslating || !sourceText.trim()}
                className="bg-medical-teal hover:bg-medical-teal/90 min-w-40"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <TranslatableText>Translating...</TranslatableText>
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    <TranslatableText>Translate</TranslatableText>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Translation; 