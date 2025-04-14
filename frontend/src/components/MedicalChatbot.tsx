import { useState, useRef, useEffect, createContext, useContext } from "react";
import { MessageCircle, X, Send, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

// Define the Message type
export type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
};

// Create a ChatContext
interface ChatContextType {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatContext = createContext<ChatContextType>({
  messages: [],
  addMessage: () => {},
  sendMessage: async () => {},
  isLoading: false
});

export const useChatContext = () => useContext(ChatContext);

const MedicalChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          content: "Hello! I'm your medical assistant. How can I help you today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input.trim());
    setInput("");
  };

  const sendMessage = async (content: string) => {
    if (!content || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Include message history to provide context for more dynamic responses
      const messageHistory = messages.map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content
      }));
      
      // Add current user message
      messageHistory.push({
        role: "user",
        content: content
      });
      
      const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_URL || "http://localhost:5001/api/chat";
      
      const response = await fetch(CHATBOT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: content,
          messages: messageHistory,
          includeContext: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      toast({
        title: "Error",
        description: "Failed to get response from medical assistant",
        variant: "destructive",
      });
      
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "Sorry, I'm having trouble connecting. Please try again later.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a message directly
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Text to speech function for accessibility
  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Create context value
  const chatContextValue: ChatContextType = {
    messages,
    addMessage,
    sendMessage,
    isLoading
  };

  return (
    <ChatContext.Provider value={chatContextValue}>
      {/* Chat button */}
      <Button
        onClick={toggleChat}
        className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-lg bg-medical-teal hover:bg-medical-teal/90 transition-all duration-300 z-50"
        aria-label="Open Medical Chatbot"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-[350px] sm:w-[400px] h-[500px] bg-background rounded-lg shadow-lg border border-border overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-medical-teal/10">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-3 bg-medical-teal">
                <MessageCircle className="h-4 w-4 text-white" />
              </Avatar>
              <div>
                <h3 className="font-semibold">Medical Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  Answers medical questions
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.sender === "bot" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 mt-1 p-0 text-xs opacity-70 hover:opacity-100"
                        onClick={() => speakMessage(message.content)}
                      >
                        <span className="sr-only">Read aloud</span>
                        <Mic className="h-3 w-3 mr-1" />
                        Listen
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg p-3 bg-muted">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your medical question..."
                className="resize-none min-h-[60px]"
                maxLength={500}
              />
              <Button
                onClick={handleSend}
                className="ml-2 h-10 px-3"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter to send. Shift+Enter for new line.
            </p>
          </div>
        </div>
      )}
    </ChatContext.Provider>
  );
};

export default MedicalChatbot; 