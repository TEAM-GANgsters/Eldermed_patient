import cv2
import numpy as np
import pytesseract
import os
import random
from fuzzywuzzy import fuzz
from tqdm import tqdm
import matplotlib.pyplot as plt
from pathlib import Path

# Path to tesseract executable
# Uncomment and set this if pytesseract can't find your Tesseract installation
# pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'  # Linux
pytesseract.pytesseract.tesseract_cmd = r'/opt/homebrew/bin/tesseract'  # macOS
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # Windows

def load_medication_names(filename):
    """Load medication names from a file."""
    with open(filename, 'r') as f:
        medications = [line.strip() for line in f if line.strip()]
    return medications

def create_image_with_text(text, font_scale=1.5, thickness=2, noise_level=0.05, blur_factor=0.5, 
                         font=None, rotation=0, background_type="plain"):
    """Create an image with the given text with various styles."""
    # Create a larger image for better resolution
    height, width = 300, 1000
    img = np.ones((height, width), dtype=np.uint8) * 255
    
    # Select font
    if font is None:
        # Use simpler fonts for better OCR recognition
        fonts = [
            cv2.FONT_HERSHEY_SIMPLEX,
            cv2.FONT_HERSHEY_PLAIN, 
            cv2.FONT_HERSHEY_DUPLEX,
            cv2.FONT_HERSHEY_COMPLEX
        ]
        font = random.choice(fonts)
    
    # Create background texture
    if background_type == "noise":
        # Add background noise (less noise for better OCR)
        noise = np.random.rand(*img.shape) * 30
        img = cv2.add(img, noise.astype(np.uint8))
    elif background_type == "gradient":
        # Create a subtle gradient background
        for i in range(img.shape[1]):
            value = 255 - int(20 * i / img.shape[1])
            img[:, i] = value
    
    # Make sure text is thick enough to be readable
    if thickness < 2:
        thickness = 2
    
    # Calculate text position to center it
    text_size = cv2.getTextSize(text, font, font_scale, thickness)[0]
    text_x = (img.shape[1] - text_size[0]) // 2
    text_y = (img.shape[0] + text_size[1]) // 2
    
    # If rotation is needed
    if rotation != 0:
        # Limit rotation angle for better OCR
        rotation = max(min(rotation, 10), -10)
        
        # Get the center of the image
        center = (img.shape[1] // 2, img.shape[0] // 2)
        
        # Create rotation matrix
        rotation_matrix = cv2.getRotationMatrix2D(center, rotation, 1.0)
        
        # Draw text on a temporary image
        temp_img = img.copy()
        cv2.putText(temp_img, text, (text_x, text_y), font, font_scale, (0, 0, 0), thickness)
        
        # Apply rotation
        img = cv2.warpAffine(temp_img, rotation_matrix, (img.shape[1], img.shape[0]))
    else:
        # Draw text directly
        cv2.putText(img, text, (text_x, text_y), font, font_scale, (0, 0, 0), thickness)
    
    # Add random noise (reduce noise level for better OCR)
    if noise_level > 0:
        noise_level = min(noise_level, 0.05)  # Cap noise level
        noise = np.random.rand(*img.shape) * 255 * noise_level
        img = cv2.add(img, noise.astype(np.uint8))
    
    # Add blur (reduce blur for better OCR)
    if blur_factor > 0:
        blur_factor = min(blur_factor, 0.3)  # Cap blur factor
        blur_size = int(3 * blur_factor) * 2 + 1  # Ensure odd number
        img = cv2.GaussianBlur(img, (blur_size, blur_size), 0)
    
    # Resize image to final resolution
    img = cv2.resize(img, (800, 200))
    
    return img

def extract_text_from_image(img, enhanced=True):
    """Extract text from an image using pytesseract with enhanced preprocessing."""
    if enhanced:
        # Make a copy of the image for processing
        processed_img = img.copy()
        
        # ENHANCEMENT 1: Deskewing to handle rotation - using a safer approach
        try:
            # Only attempt deskewing if there's enough black pixels
            nonzero = cv2.countNonZero(cv2.threshold(processed_img, 200, 255, cv2.THRESH_BINARY_INV)[1])
            if nonzero > 100:  # Only attempt if we have enough foreground pixels
                # Find all contours in the image
                contours, _ = cv2.findContours(
                    cv2.threshold(processed_img, 200, 255, cv2.THRESH_BINARY_INV)[1],
                    cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE
                )
                
                # Find the largest contour by area
                if contours:
                    largest_contour = max(contours, key=cv2.contourArea)
                    if cv2.contourArea(largest_contour) > 100:  # Only use substantial contours
                        # Get the minimum area rectangle
                        rect = cv2.minAreaRect(largest_contour)
                        angle = rect[-1]
                        
                        # Adjust angle for correct rotation
                        if angle < -45:
                            angle = -(90 + angle)
                        else:
                            angle = -angle
                        
                        # Only rotate if angle is significant but not extreme
                        if 0.5 < abs(angle) < 20:
                            (h, w) = processed_img.shape[:2]
                            center = (w // 2, h // 2)
                            M = cv2.getRotationMatrix2D(center, angle, 1.0)
                            processed_img = cv2.warpAffine(processed_img, M, (w, h), 
                                                        flags=cv2.INTER_CUBIC, 
                                                        borderMode=cv2.BORDER_REPLICATE)
        except Exception as e:
            # If deskewing fails, just continue with original image
            print(f"Deskewing failed: {e}")
            pass
        
        # ENHANCEMENT 2: Apply multiple preprocessing techniques
        results = []
        
        # Create preprocessing variants
        preprocessing_variants = []
        
        # Method 1: Adaptive thresholding with different block sizes
        for block_size in [7, 11, 15]:
            binary_adaptive = cv2.adaptiveThreshold(
                processed_img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, block_size, 2
            )
            # Clean noise with morphological operations
            kernel = np.ones((1, 1), np.uint8)
            binary_adaptive = cv2.morphologyEx(binary_adaptive, cv2.MORPH_OPEN, kernel)
            preprocessing_variants.append(binary_adaptive)
        
        # Method 2: Otsu's thresholding
        _, binary_otsu = cv2.threshold(processed_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        preprocessing_variants.append(binary_otsu)
        
        # Method 3: CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_contrast = clahe.apply(processed_img)
        _, binary_enhanced = cv2.threshold(enhanced_contrast, 150, 255, cv2.THRESH_BINARY)
        preprocessing_variants.append(binary_enhanced)
        
        # Method 4: Regular thresholding with different values
        for thresh_val in [120, 150, 180]:
            _, binary_simple = cv2.threshold(processed_img, thresh_val, 255, cv2.THRESH_BINARY)
            preprocessing_variants.append(binary_simple)
        
        # Method 5: Original image with no processing
        preprocessing_variants.append(processed_img)
        
        # ENHANCEMENT 3: Try different Tesseract configurations
        configs = [
            '--oem 3 --psm 6',  # Assume a single uniform block of text
            '--oem 3 --psm 7',  # Treat the image as a single line of text
            '--oem 3 --psm 8',  # Treat the image as a single word
            '--oem 1 --psm 7',  # LSTM only, single line
            '--oem 1 --psm 8'   # LSTM only, single word
        ]
        
        # Try all combinations of preprocessing and configs
        for img_variant in preprocessing_variants:
            for config in configs:
                try:
                    text = pytesseract.image_to_string(img_variant, config=config).strip()
                    if text:
                        results.append(text)
                except Exception:
                    # If OCR fails for a specific variant, just continue
                    continue
        
        # If we have no results, try basic OCR on original image
        if not results:
            try:
                text = pytesseract.image_to_string(img).strip()
                if text:
                    results.append(text)
            except Exception:
                pass
        
        # ENHANCEMENT 4: Post-processing to clean up text
        cleaned_results = []
        for text in results:
            # Basic cleaning: remove non-alphanumeric except spaces
            cleaned = ''.join(c if c.isalnum() or c.isspace() else ' ' for c in text)
            # Remove extra whitespace
            cleaned = ' '.join(cleaned.split())
            if cleaned and len(cleaned) > 1:  # Only keep results with at least 2 chars
                cleaned_results.append(cleaned)
        
        # If we have results, select the best one
        if cleaned_results:
            # Count occurrences of each result
            from collections import Counter
            result_counts = Counter(cleaned_results)
            
            # If there's a clear winner by frequency (appears more than once), use it
            most_common_results = result_counts.most_common(2)
            if len(most_common_results) > 1 and most_common_results[0][1] > most_common_results[1][1]:
                return most_common_results[0][0]
            
            # Otherwise, use the longest result that's not excessively long
            # (Sometimes OCR produces very long garbage strings)
            reasonable_results = [r for r in cleaned_results if len(r) <= 30]
            if reasonable_results:
                return max(reasonable_results, key=len)
            
            # If all results are too long, use the shortest one
            return min(cleaned_results, key=len)
            
        # If no text was found with any method
        return ""
    else:
        # Simple binary threshold (original method)
        _, binary_img = cv2.threshold(img, 150, 255, cv2.THRESH_BINARY)
        text = pytesseract.image_to_string(binary_img).strip()
        return text

def evaluate_similarity(original, extracted):
    """Evaluate the similarity between original and extracted text."""
    if not extracted:
        return 0
    
    # Calculate token sort ratio to handle word order differences
    similarity = fuzz.token_sort_ratio(original.lower(), extracted.lower())
    return similarity

def run_ocr_test(medication_names, num_samples=10, output_dir="ocr_test_results", save_images=True, use_enhanced=True, use_dictionary_correction=True):
    """Run OCR test on a sample of medication names with various styles."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Sample medication names
    if num_samples > len(medication_names):
        num_samples = len(medication_names)
    
    sampled_medications = random.sample(medication_names, num_samples)
    
    results = []
    
    for i, med_name in enumerate(tqdm(sampled_medications, desc="Testing OCR")):
        # Randomize parameters for more realistic testing
        font_scale = random.uniform(1.2, 2.0)
        thickness = random.randint(1, 3)
        noise_level = random.uniform(0.01, 0.1)
        blur_factor = random.uniform(0.2, 0.8)
        rotation = random.uniform(-10, 10) if random.random() > 0.7 else 0
        
        # Randomly select background type
        background_type = random.choice(["plain", "noise", "gradient"])
        
        # Create an image with the medication name
        img = create_image_with_text(
            med_name, 
            font_scale=font_scale, 
            thickness=thickness, 
            noise_level=noise_level, 
            blur_factor=blur_factor,
            rotation=rotation,
            background_type=background_type
        )
        
        # Extract text using OCR
        extracted_text = extract_text_from_image(img, enhanced=use_enhanced)
        
        # Record raw OCR result before correction
        raw_ocr_result = extracted_text
        raw_similarity = evaluate_similarity(med_name, raw_ocr_result)
        
        # Apply dictionary-based correction if enabled
        if use_dictionary_correction and extracted_text:
            extracted_text = medication_dictionary_correction(extracted_text, medication_names)
        
        # Evaluate similarity with the final text
        similarity = evaluate_similarity(med_name, extracted_text)
        
        results.append({
            "original": med_name,
            "extracted": extracted_text,
            "raw_ocr": raw_ocr_result,
            "raw_similarity": raw_similarity,
            "similarity": similarity,
            "correction_applied": (raw_ocr_result != extracted_text),
            "params": {
                "font_scale": font_scale,
                "thickness": thickness,
                "noise_level": noise_level,
                "blur_factor": blur_factor,
                "rotation": rotation,
                "background": background_type
            }
        })
        
        # Save the image and results
        if save_images:
            img_filename = f"{i}_{med_name.replace(' ', '_')}.png"
            cv2.imwrite(os.path.join(output_dir, img_filename), img)
    
    return results

def display_results(results):
    """Display OCR test results with detailed statistics."""
    # Calculate overall accuracy
    similarities = [result["similarity"] for result in results]
    avg_similarity = sum(similarities) / len(similarities) if similarities else 0
    
    # Get raw similarities for comparison (before dictionary correction)
    raw_similarities = [result["raw_similarity"] for result in results]
    avg_raw_similarity = sum(raw_similarities) / len(raw_similarities) if raw_similarities else 0
    
    # Count perfect matches
    perfect_matches = sum(1 for sim in similarities if sim == 100)
    perfect_match_rate = (perfect_matches / len(similarities)) * 100 if similarities else 0
    
    # Count corrections applied
    corrections_applied = sum(1 for result in results if result.get("correction_applied", False))
    correction_rate = (corrections_applied / len(results)) * 100 if results else 0
    
    # Calculate improvement from dictionary correction
    improvement = avg_similarity - avg_raw_similarity
    
    # Calculate performance by background type
    background_stats = {}
    for result in results:
        bg_type = result["params"]["background"]
        if bg_type not in background_stats:
            background_stats[bg_type] = {"count": 0, "total_sim": 0}
        background_stats[bg_type]["count"] += 1
        background_stats[bg_type]["total_sim"] += result["similarity"]
    
    # Calculate performance by rotation (grouped)
    rotation_stats = {
        "none": {"count": 0, "total_sim": 0},
        "slight": {"count": 0, "total_sim": 0},
        "moderate": {"count": 0, "total_sim": 0}
    }
    
    for result in results:
        rotation = abs(result["params"]["rotation"])
        if rotation == 0:
            category = "none"
        elif rotation < 5:
            category = "slight"
        else:
            category = "moderate"
        
        rotation_stats[category]["count"] += 1
        rotation_stats[category]["total_sim"] += result["similarity"]
    
    # Print summary statistics
    print(f"OCR Test Results Summary")
    print("=" * 50)
    print(f"Total samples tested: {len(results)}")
    print(f"Average similarity (with corrections): {avg_similarity:.2f}%")
    print(f"Average similarity (raw OCR only): {avg_raw_similarity:.2f}%")
    print(f"Improvement from dictionary correction: {improvement:.2f}%")
    print(f"Dictionary corrections applied: {corrections_applied}/{len(results)} ({correction_rate:.1f}%)")
    print(f"Perfect match rate: {perfect_match_rate:.2f}% ({perfect_matches}/{len(results)})")
    
    print("\nPerformance by Background Type:")
    for bg_type, stats in background_stats.items():
        avg = stats["total_sim"] / stats["count"] if stats["count"] > 0 else 0
        print(f"  - {bg_type}: {avg:.2f}% ({stats['count']} samples)")
    
    print("\nPerformance by Rotation:")
    for rotation_type, stats in rotation_stats.items():
        if stats["count"] > 0:
            avg = stats["total_sim"] / stats["count"]
            print(f"  - {rotation_type}: {avg:.2f}% ({stats['count']} samples)")
    
    print("\nDetailed Results:")
    print("-" * 50)
    
    # Print just a sample of the detailed results to avoid overwhelming output
    sample_size = min(10, len(results))
    sampled_results = random.sample(results, sample_size)
    
    for result in sampled_results:
        print(f"Original: {result['original']}")
        print(f"Raw OCR: {result['raw_ocr']} ({result['raw_similarity']}%)")
        
        if result.get("correction_applied", False):
            print(f"Corrected: {result['extracted']} ({result['similarity']}%) ⭐")
        else:
            print(f"Final: {result['extracted']} ({result['similarity']}%)")
            
        params = result["params"]
        print(f"Image params: rotation={params['rotation']:.1f}°, background={params['background']}")
        print("-" * 50)
    
    # Plot histogram of similarity scores
    plt.figure(figsize=(12, 10))
    
    # First subplot: Raw vs Corrected similarity histogram
    plt.subplot(2, 2, 1)
    plt.hist([raw_similarities, similarities], bins=10, alpha=0.7, 
             label=['Raw OCR', 'With Correction'], color=['blue', 'green'])
    plt.xlabel('Similarity Score (%)')
    plt.ylabel('Frequency')
    plt.title('OCR Similarity Scores: Raw vs Corrected')
    plt.legend()
    
    # Second subplot: Correction improvement
    plt.subplot(2, 2, 2)
    # Calculate improvement for each result
    improvements = [result["similarity"] - result["raw_similarity"] for result in results]
    plt.hist(improvements, bins=10, alpha=0.7, color='purple')
    plt.xlabel('Improvement (%)')
    plt.ylabel('Frequency')
    plt.title('Dictionary Correction Improvement')
    
    # Third subplot: Background type performance
    plt.subplot(2, 2, 3)
    bg_types = list(background_stats.keys())
    bg_scores = [stats["total_sim"]/stats["count"] if stats["count"] > 0 else 0 
                for stats in background_stats.values()]
    plt.bar(bg_types, bg_scores, alpha=0.7, color='green')
    plt.xlabel('Background Type')
    plt.ylabel('Average Similarity (%)')
    plt.title('Performance by Background Type')
    
    # Fourth subplot: Rotation performance
    plt.subplot(2, 2, 4)
    rot_types = list(rotation_stats.keys())
    rot_scores = [stats["total_sim"]/stats["count"] if stats["count"] > 0 else 0 
                 for stats in rotation_stats.values()]
    plt.bar(rot_types, rot_scores, alpha=0.7, color='orange')
    plt.xlabel('Rotation')
    plt.ylabel('Average Similarity (%)')
    plt.title('Performance by Rotation')
    
    plt.tight_layout()
    plt.savefig(os.path.join("ocr_test_results", "ocr_performance.png"))
    plt.close()
    
    print(f"\nPerformance charts saved to 'ocr_test_results/ocr_performance.png'")

def medication_dictionary_correction(text, medication_list, threshold=60):
    """
    Correct OCR text using a dictionary of known medications with advanced matching.
    
    Args:
        text: The OCR extracted text
        medication_list: List of known medication names
        threshold: Minimum similarity threshold (default 60%)
        
    Returns:
        Corrected text if a good match is found, otherwise original text
    """
    if not text or len(text) < 2:
        return text
    
    # If exact match found, return immediately
    if text in medication_list:
        return text
    
    # Try to find the best match using multiple fuzzy matching algorithms
    best_match = None
    best_score = 0
    
    # Check both the whole text and individual words
    text_parts = text.split()
    candidates = [text] + text_parts  # Check both full text and individual words
    
    # Remove very short and common words (like 'a', 'the', etc.)
    common_words = ['a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with']
    candidates = [c for c in candidates if len(c) > 2 and c.lower() not in common_words]
    
    # If no candidates after filtering, return original text
    if not candidates:
        return text
        
    # Create character n-grams (2-grams and 3-grams) for more robust matching
    n_grams = []
    for candidate in candidates:
        if len(candidate) >= 3:
            # Generate 2-grams
            for i in range(len(candidate) - 1):
                n_grams.append(candidate[i:i+2])
            # Generate 3-grams
            for i in range(len(candidate) - 2):
                n_grams.append(candidate[i:i+3])
    
    # Add unique n-grams to candidates
    candidates.extend(list(set(n_grams)))
    
    # For each candidate, try different fuzzy matching algorithms
    for candidate in candidates:
        # Skip very short candidates
        if len(candidate) < 2:
            continue
            
        for med in medication_list:
            # 1. Token sort ratio (handles word order differences)
            score = fuzz.token_sort_ratio(candidate.lower(), med.lower())
            if score > best_score:
                best_score = score
                best_match = med
            
            # 2. Partial ratio (substring matching)
            score = fuzz.partial_ratio(candidate.lower(), med.lower())
            if score > best_score:
                best_score = score
                best_match = med
            
            # 3. Token set ratio (handles extra words)
            score = fuzz.token_set_ratio(candidate.lower(), med.lower())
            if score > best_score:
                best_score = score
                best_match = med
                
            # 4. Simple starts-with matching for prefix matching
            if med.lower().startswith(candidate.lower()) and len(candidate) >= 3:
                score = (len(candidate) / len(med)) * 100
                if score > best_score:
                    best_score = score
                    best_match = med
    
    # If we found a good match above threshold, return it
    if best_match and best_score >= threshold:
        return best_match
    
    # Otherwise return original text
    return text

def main():
    # Test parameters
    medication_file = "indian_medications.txt"
    num_samples = 50
    
    # Load medication names
    medication_names = load_medication_names(medication_file)
    print(f"Loaded {len(medication_names)} medication names")
    
    # Run tests with different configurations to compare performance
    results = {}
    
    # Test 1: Basic OCR (no enhancements)
    print("\nRunning Test 1: Basic OCR (no enhancements)")
    results["basic"] = run_ocr_test(
        medication_names, 
        num_samples, 
        output_dir="ocr_test_basic",
        use_enhanced=False,
        use_dictionary_correction=False
    )
    
    # Test 2: Enhanced OCR only
    print("\nRunning Test 2: Enhanced OCR only")
    results["enhanced_ocr"] = run_ocr_test(
        medication_names, 
        num_samples, 
        output_dir="ocr_test_enhanced",
        use_enhanced=True,
        use_dictionary_correction=False
    )
    
    # Test 3: Enhanced OCR + Dictionary correction
    print("\nRunning Test 3: Enhanced OCR + Dictionary correction")
    results["full"] = run_ocr_test(
        medication_names, 
        num_samples, 
        output_dir="ocr_test_full",
        use_enhanced=True,
        use_dictionary_correction=True
    )
    
    # Display results for each test
    print("\n" + "=" * 50)
    print("TEST RESULTS SUMMARY")
    print("=" * 50)
    
    # Calculate average similarities
    avg_basic = sum(r["similarity"] for r in results["basic"]) / len(results["basic"])
    avg_enhanced = sum(r["similarity"] for r in results["enhanced_ocr"]) / len(results["enhanced_ocr"])
    avg_full = sum(r["similarity"] for r in results["full"]) / len(results["full"])
    
    # Calculate perfect matches
    perfect_basic = sum(1 for r in results["basic"] if r["similarity"] == 100)
    perfect_enhanced = sum(1 for r in results["enhanced_ocr"] if r["similarity"] == 100)
    perfect_full = sum(1 for r in results["full"] if r["similarity"] == 100)
    
    # Print comparison
    print(f"Test 1 (Basic OCR): {avg_basic:.2f}% accuracy, {perfect_basic}/{num_samples} perfect matches")
    print(f"Test 2 (Enhanced OCR): {avg_enhanced:.2f}% accuracy, {perfect_enhanced}/{num_samples} perfect matches")
    print(f"Test 3 (Full Pipeline): {avg_full:.2f}% accuracy, {perfect_full}/{num_samples} perfect matches")
    
    # Print improvement percentages
    print(f"\nImprovement from basic to enhanced OCR: {avg_enhanced - avg_basic:.2f}%")
    print(f"Improvement from enhanced OCR to full pipeline: {avg_full - avg_enhanced:.2f}%")
    print(f"Total improvement: {avg_full - avg_basic:.2f}%")
    
    # Save comparison chart
    plt.figure(figsize=(10, 6))
    plt.bar(['Basic OCR', 'Enhanced OCR', 'Full Pipeline'], 
            [avg_basic, avg_enhanced, avg_full], 
            color=['blue', 'green', 'purple'])
    plt.ylabel('Average Accuracy (%)')
    plt.title('OCR Performance Comparison')
    plt.savefig('ocr_comparison.png')
    plt.close()
    
    print("\nDetailed results for each test configuration have been saved to:")
    print("- ocr_test_basic/")
    print("- ocr_test_enhanced/")
    print("- ocr_test_full/")
    print("\nComparison chart saved to ocr_comparison.png")
    
    # Return full results for further analysis if needed
    return results

if __name__ == "__main__":
    main() 