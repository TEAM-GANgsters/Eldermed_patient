import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowUp, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediCard from "@/components/MediCard";
import { Input } from "@/components/ui/input";
import GsapReveal from "@/components/GsapReveal";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useChatContext } from "@/components/MedicalChatbot";
import TranslatableText from "@/components/TranslatableText";
import { initSpeechRecognition } from "@/utils/speechRecognition";

const Support = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  
  // For translating placeholders
  const listeningPlaceholder = "Listening...";
  const questionPlaceholder = "Type or speak your question...";
  
  // Use the shared chat context
  const { messages, isLoading, sendMessage, addMessage } = useChatContext();
  
  // Add welcome message if no messages exist
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        content: "Hello! I'm MediBot, your AI medication assistant. How can I help you today? You can type or use the microphone button to speak your question.",
        sender: "bot"
      });
    }
  }, [messages.length, addMessage]);
  
  // Initialize speech recognition
  useEffect(() => {
    recognitionRef.current = initSpeechRecognition();
    
    if (recognitionRef.current) {
      // Handle recognition results
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        stopListening();
        
        // Auto-send after voice input
        sendMessage(transcript);
        setInput("");
      };
      
      // Handle errors
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
        toast({
          title: "Voice Recognition Error",
          description: `Error: ${event.error}. Please try again or type manually.`,
          variant: "destructive",
        });
      };
      
      // Handle end of speech
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error('Error aborting speech recognition:', e);
        }
      }
    };
  }, [toast, sendMessage]);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support voice input. Please type your question instead.",
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
      recognitionRef.current?.start();
      setIsListening(true);
      toast({
        description: "Listening... Speak your question clearly.",
        className: "bg-medical-teal text-white",
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
    }
  };
  
  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  };
  
  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  const goBack = () => navigate(-1);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex justify-between items-center p-4 border-b flex-shrink-0">
        <Button variant="ghost" onClick={goBack}>
          <ArrowUp className="w-5 h-5 transform -rotate-90" />
          <span className="ml-2"><TranslatableText>Back</TranslatableText></span>
        </Button>
        <h1 className="text-xl font-bold"><TranslatableText>MediBot Support</TranslatableText></h1>
        <div className="w-10"></div> {/* For layout balance */}
      </header>
      
      <div className="flex flex-col flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Chat messages - scrollable area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ scrollbarWidth: 'thin' }}>
          {messages.map((message) => (
            <GsapReveal 
              key={message.id} 
              animation="slide" 
              delay={0.2} 
              className={cn(
                "mb-6",
                message.sender === "user" ? "ml-auto" : "mr-auto",
                "max-w-[85%] md:max-w-[75%]"
              )}
            >
              <MediCard
                neumorphic={message.sender === "user"}
                gradient={message.sender === "bot"}
                className={cn(
                  "p-4",
                  message.sender === "user" 
                    ? "bg-medical-teal text-white" 
                    : ""
                )}
              >
                <div className="flex gap-3">
                  {message.sender === "bot" && (
                    <div className="w-10 h-10 rounded-full bg-medical-purple/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-medical-purple font-bold text-sm">AI</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className={cn(
                      "text-base leading-relaxed",
                      message.sender === "user" ? "text-white" : ""
                    )}>
                      {message.content}
                    </div>
                  </div>
                </div>
              </MediCard>
            </GsapReveal>
          ))}
          
          {isLoading && (
            <GsapReveal animation="slide" className="mb-6 mr-auto max-w-[85%] md:max-w-[75%]">
              <MediCard gradient className="p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-medical-purple/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-medical-purple font-bold text-sm">AI</span>
                  </div>
                  <div className="flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <p className="text-sm"><TranslatableText>Thinking...</TranslatableText></p>
                  </div>
                </div>
              </MediCard>
            </GsapReveal>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Voice recording indicator */}
        {isListening && (
          <div className="flex items-center justify-center py-3 px-4 bg-medical-teal/10 border-t border-b border-medical-teal/20 flex-shrink-0">
            <div className="flex items-center gap-3 text-medical-teal animate-pulse">
              <div className="w-4 h-4 rounded-full bg-medical-teal"></div>
              <span className="font-medium text-base"><TranslatableText>Listening... Speak clearly</TranslatableText></span>
            </div>
          </div>
        )}
        
        {/* Chat input bar */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-3">
            <Input
              id="messageInput"
              name="messageInput"
              className="flex-1 text-base h-14 px-4"
              placeholder={isListening ? listeningPlaceholder : questionPlaceholder}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isListening || isLoading}
              aria-label="Message input"
            />
            {/* Next to the input field, add translated versions of the placeholders for screen readers */}
            <div className="sr-only" aria-hidden="true">
              <TranslatableText>{listeningPlaceholder}</TranslatableText>
              <TranslatableText>{questionPlaceholder}</TranslatableText>
            </div>
            <Button 
              onClick={toggleListening} 
              className={cn(
                "h-14 w-14",
                isListening 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-medical-purple hover:bg-medical-purple/90"
              )}
              disabled={isLoading}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
            <Button 
              onClick={handleSendMessage} 
              className="bg-medical-teal hover:bg-medical-teal/90 h-14 w-14"
              disabled={!input.trim() || isListening || isLoading}
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground mt-4 text-center">
            {isListening ? 
              <TranslatableText>Click the microphone button again when you're done speaking</TranslatableText> : 
              <TranslatableText>For medical emergencies, please call your doctor or emergency services</TranslatableText>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
