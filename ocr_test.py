import os
import cv2
import numpy as np
import pytesseract
from fuzzywuzzy import process
import matplotlib.pyplot as plt

# Set Tesseract path
pytesseract.pytesseract.tesseract_cmd = r'/opt/homebrew/bin/tesseract'  # macOS

# Load the known medication names
def load_medication_names(file_path='indian_medications.txt'):
    with open(file_path, 'r') as f:
        return [line.strip() for line in f.readlines() if line.strip()]

def preprocess_image(image_path):
    """Preprocess the image for better OCR results"""
    # Read the image
    img = cv2.imread(image_path)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Apply dilation and erosion to remove noise
    kernel = np.ones((1, 1), np.uint8)
    dilation = cv2.dilate(thresh, kernel, iterations=1)
    erosion = cv2.erode(dilation, kernel, iterations=1)
    
    return img, erosion

def detect_text(processed_img):
    """Extract text using pytesseract OCR"""
    config = r'--oem 3 --psm 6'
    text = pytesseract.image_to_string(processed_img, config=config)
    return text

def match_medications(text, known_medications, threshold=80):
    """Match detected text with known medication names"""
    # Split the text into words
    words = [word.strip() for word in text.split()]
    
    matches = []
    for word in words:
        if len(word) > 3:  # Skip very short words
            # Find the best match
            best_match, score = process.extractOne(word, known_medications)
            if score >= threshold:
                matches.append((word, best_match, score))
    
    return matches

def visualize_results(original_img, text, matches):
    """Visualize the OCR results"""
    plt.figure(figsize=(15, 10))
    
    # Display the original image
    plt.subplot(1, 2, 1)
    plt.imshow(cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB))
    plt.title('Original Prescription')
    plt.axis('off')
    
    # Display the text and matches
    plt.subplot(1, 2, 2)
    plt.text(0.1, 0.95, 'Extracted Text:', fontsize=12, fontweight='bold')
    plt.text(0.1, 0.9, text, fontsize=10, wrap=True)
    
    plt.text(0.1, 0.5, 'Matched Medications:', fontsize=12, fontweight='bold')
    match_text = '\n'.join([f"Detected: {m[0]} → Matched: {m[1]} (Score: {m[2]})" for m in matches])
    plt.text(0.1, 0.45, match_text, fontsize=10)
    plt.axis('off')
    
    plt.tight_layout()
    plt.savefig('ocr_results.png')
    plt.show()

def main():
    # Load known medication names
    known_medications = load_medication_names()
    print(f"Loaded {len(known_medications)} known medication names")
    
    # Process images from test_images folder
    test_dir = 'test_images'
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
        print(f"Created {test_dir} directory. Please add prescription images to this folder.")
        return
    
    image_files = [f for f in os.listdir(test_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    if not image_files:
        print(f"No images found in {test_dir}. Please add some prescription images.")
        return
    
    for image_file in image_files:
        print(f"\nProcessing {image_file}...")
        image_path = os.path.join(test_dir, image_file)
        
        # Preprocess the image
        original_img, processed_img = preprocess_image(image_path)
        
        # Detect text
        text = detect_text(processed_img)
        print("Extracted text:")
        print(text)
        
        # Match medications
        matches = match_medications(text, known_medications)
        print("\nMatched medications:")
        for match in matches:
            print(f"Detected: {match[0]} → Matched: {match[1]} (Score: {match[2]})")
        
        # Visualize results
        visualize_results(original_img, text, matches)

if __name__ == "__main__":
    main() 