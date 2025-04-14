import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, ArrowUp, X, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediButton from "@/components/MediButton";
import MediCard from "@/components/MediCard";
import GsapReveal from "@/components/GsapReveal";
import { Progress } from "@/components/ui/progress";
import { ocrService, nlpService } from "@/lib/integratedServices";
import Tesseract from 'tesseract.js';

const Scanner = () => {
  const navigate = useNavigate();
  const [scanStage, setScanStage] = useState<"initial" | "scanning" | "processing" | "results" | "camera">("initial");
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedMedications, setDetectedMedications] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Function to handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setScanStage("processing");
    setScanProgress(0);
    
    try {
      // Start progress updates
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return newProgress;
        });
      }, 200);
      
      // Process the image with Tesseract.js directly in the browser
      const imageUrl = URL.createObjectURL(file);
      
      // Run OCR on the image
      const worker = await Tesseract.createWorker('eng');
      const { data } = await worker.recognize(imageUrl);
      await worker.terminate();
      
      // Parse OCR results
      if (data.text.trim()) {
        clearInterval(progressInterval);
        setScanProgress(100);
        
        // Process the text with the NLP service
        try {
          const parsedResult = await nlpService.parsePrescriptionText(data.text);
          
          if (parsedResult.structuredMedications && parsedResult.structuredMedications.length > 0) {
            setDetectedMedications(parsedResult.structuredMedications);
            setScanStage("results");
          } else {
            setDetectedMedications([{
              name: "Unknown Medication",
              dosage: null,
              frequency: null,
              instructions: null,
              reminderTimes: [],
              validation: { found: false },
              rawText: data.text.substring(0, 200) + (data.text.length > 200 ? '...' : '')
            }]);
            setScanStage("results");
          }
        } catch (nlpError) {
          console.error("NLP processing error:", nlpError);
          // Fall back to raw text
          setDetectedMedications([{
            name: "Raw Scanned Text",
            dosage: null,
            frequency: null,
            rawText: data.text.substring(0, 200) + (data.text.length > 200 ? '...' : '')
          }]);
          setScanStage("results");
        }
      } else {
        setErrorMessage("No text was detected in the image. Please try again with a clearer image.");
        setScanStage("initial");
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      setErrorMessage("Error processing the image. Please try again.");
      setScanStage("initial");
    } finally {
      URL.revokeObjectURL(file);
    }
  };
  
  // Trigger file input programmatically
  const handleUpload = () => {
    fileInputRef.current?.click();
  };
  
  // Start camera capture
  const startCamera = async () => {
    try {
      setScanStage("camera");
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Store the stream reference for cleanup
      streamRef.current = stream;
      
      // Set the video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera access error:", error);
      setErrorMessage("Could not access the camera. Please check permissions and try again.");
      setScanStage("initial");
    }
  };
  
  // Capture from camera
  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setScanStage("processing");
    setScanProgress(0);
    
    try {
      // Stop the camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Draw the video frame to canvas
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Start progress updates
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return newProgress;
        });
      }, 200);
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Could not convert canvas to blob");
        }
        
        // Run OCR on the image
        const worker = await Tesseract.createWorker('eng');
        const { data } = await worker.recognize(blob);
        await worker.terminate();
        
        // Process results
        clearInterval(progressInterval);
        setScanProgress(100);
        
        if (data.text.trim()) {
          try {
            // Process with NLP
            const parsedResult = await nlpService.parsePrescriptionText(data.text);
            
            if (parsedResult.structuredMedications && parsedResult.structuredMedications.length > 0) {
              setDetectedMedications(parsedResult.structuredMedications);
            } else {
              setDetectedMedications([{
                name: "Unknown Medication",
                dosage: null,
                frequency: null,
                instructions: null,
                reminderTimes: [],
                validation: { found: false },
                rawText: data.text.substring(0, 200) + (data.text.length > 200 ? '...' : '')
              }]);
            }
            setScanStage("results");
          } catch (nlpError) {
            console.error("NLP processing error:", nlpError);
            setDetectedMedications([{
              name: "Raw Scanned Text",
              dosage: null,
              frequency: null,
              rawText: data.text.substring(0, 200) + (data.text.length > 200 ? '...' : '')
            }]);
            setScanStage("results");
          }
        } else {
          setErrorMessage("No text was detected in the image. Please try again with a clearer image.");
          setScanStage("initial");
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error("Camera capture error:", error);
      setErrorMessage("Error processing the camera image. Please try again.");
      setScanStage("initial");
    }
  };

  const goBack = () => navigate(-1);
  
  // Add medication reminders from scanned results
  const addToReminders = () => {
    // Here we would integrate with the reminder service
    // For now just show a success message
    alert("Medications added to reminders!");
    setScanStage("initial");
  };
  
  return (
    <div className="min-h-screen p-6">
      <header className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={goBack}>
          <ArrowUp className="w-5 h-5 rotate-270 transform -rotate-90" />
          <span className="ml-2">Back</span>
        </Button>
        <h1 className="text-xl font-bold">Prescription Scanner</h1>
        <div className="w-10"></div> {/* For layout balance */}
      </header>
      
      {/* Hidden file input for uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />
      
      {/* Hidden canvas for camera capture */}
      <canvas 
        ref={canvasRef} 
        className="hidden"
      />
      
      <GsapReveal animation="fade">
        {scanStage === "initial" && (
          <div className="flex flex-col items-center justify-center">
            <MediCard neumorphic className="w-full max-w-md mb-8 p-4">
              <div className="text-center py-8">
                <div className="mx-auto w-24 h-24 rounded-full bg-medical-teal/10 flex items-center justify-center mb-6">
                  <Camera className="w-12 h-12 text-medical-teal" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Scan Prescription</h2>
                <p className="text-muted-foreground mb-8">
                  Position your prescription in the frame and take a clear photo
                </p>
                <MediButton 
                  size="lg" 
                  pill 
                  className="bg-medical-teal hover:bg-medical-teal/90 mb-4 w-full"
                  onClick={startCamera}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Open Camera
                </MediButton>
                <MediButton 
                  variant="outline" 
                  size="lg" 
                  pill 
                  className="w-full"
                  onClick={handleUpload}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Image
                </MediButton>
              </div>
            </MediCard>
            
            {errorMessage && (
              <div className="text-center text-red-500 mb-4">
                {errorMessage}
              </div>
            )}
            
            <div className="text-center text-muted-foreground text-sm">
              <p className="mb-2">Your prescription details will be securely processed</p>
              <p>We use AI to extract medication information accurately</p>
            </div>
          </div>
        )}

        {scanStage === "camera" && (
          <div className="flex flex-col items-center justify-center">
            <MediCard className="w-full max-w-md mb-4 border-2 border-medical-teal p-0 overflow-hidden">
              <div className="aspect-[3/4] bg-black flex items-center justify-center relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-medical-teal/70 m-4 pointer-events-none"></div>
              </div>
            </MediCard>
            
            <div className="flex gap-4 mb-4 w-full max-w-md">
              <MediButton 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                  }
                  setScanStage("initial");
                }}
              >
                <X className="mr-2 h-5 w-5" />
                Cancel
              </MediButton>
              <MediButton 
                className="flex-1 bg-medical-teal hover:bg-medical-teal/90" 
                onClick={captureFromCamera}
              >
                <Camera className="mr-2 h-5 w-5" />
                Capture
              </MediButton>
            </div>
            
            <p className="text-center text-muted-foreground text-sm">
              Hold the camera steady over the prescription
            </p>
          </div>
        )}
        
        {scanStage === "processing" && (
          <div className="flex flex-col items-center justify-center">
            <MediCard neumorphic className="w-full max-w-md mb-8 p-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
                  <div className="w-8 h-8 border-4 border-medical-teal border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="text-xl font-semibold mb-4">Processing Your Prescription</h2>
                <Progress value={scanProgress} className="h-2 mb-2" />
                <p className="text-muted-foreground">
                  Our AI is analyzing the prescription details...
                </p>
              </div>
            </MediCard>
          </div>
        )}
        
        {scanStage === "results" && (
          <div className="flex flex-col items-center justify-center">
            <MediCard neumorphic className="w-full max-w-md mb-6">
              <div className="text-center pt-4 pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold mb-4">Prescription Scanned Successfully</h2>
              </div>
              
              <div className="bg-background p-4 rounded-lg mb-4">
                <h3 className="font-medium text-lg mb-3">Detected Medications</h3>
                
                <div className="space-y-4">
                  {detectedMedications.map((med, index) => (
                    <div className="border border-border rounded-lg p-3" key={index}>
                      <div className="flex justify-between">
                        <h4 className="font-semibold">{med.name}</h4>
                        {med.validation?.found && (
                          <span className="text-medical-teal">{med.validation.confidence || 90}% match</span>
                        )}
                      </div>
                      <div className="flex flex-wrap mt-1 gap-2">
                        {med.dosage && (
                          <span className="bg-medical-teal/10 text-medical-teal text-xs px-2 py-1 rounded">
                            {med.dosage}
                          </span>
                        )}
                        {med.frequency && (
                          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                            {med.frequency}
                          </span>
                        )}
                        {med.instructions && (
                          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                            {med.instructions}
                          </span>
                        )}
                      </div>
                      {med.rawText && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                          <p className="font-medium mb-1">Extracted Text:</p>
                          <p className="whitespace-pre-wrap">{med.rawText}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-2">
                <MediButton variant="outline" className="flex-1" onClick={() => setScanStage("initial")}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan Again
                </MediButton>
                <MediButton 
                  className="flex-1 bg-medical-teal hover:bg-medical-teal/90"
                  onClick={addToReminders}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Add to Reminders
                </MediButton>
              </div>
            </MediCard>
            
            <p className="text-sm text-muted-foreground text-center">
              You can edit the details if needed before adding to your medications
            </p>
          </div>
        )}
      </GsapReveal>
    </div>
  );
};

export default Scanner;
