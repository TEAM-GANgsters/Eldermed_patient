/**
 * Speech Recognition Types
 * 
 * This file defines common types for using the Web Speech API
 * to be shared across components
 */

export interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
  error?: { message: string };
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

// Augment the Window interface globally
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInterface;
    webkitSpeechRecognition?: new () => SpeechRecognitionInterface;
  }
}

/**
 * Speech Recognition Utility Functions
 */

/**
 * Initialize a speech recognition instance with default settings
 */
export function initSpeechRecognition(): SpeechRecognitionInterface | null {
  if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    console.warn('Speech recognition is not supported in this browser');
    return null;
  }
  
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionAPI();
  
  // Configure with default settings
  recognition.continuous = false;
  recognition.interimResults = false;
  
  return recognition;
} 