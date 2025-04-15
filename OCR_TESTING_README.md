# OCR Testing Framework for Indian Medication Names

This framework provides a comprehensive solution for testing Optical Character Recognition (OCR) performance on Indian medication names. It includes utilities for generating synthetic test images, performing OCR with various enhancement techniques, and evaluating recognition accuracy.

## Overview

The OCR testing framework includes the following key components:

1. **Synthetic Image Generation**: Creates test images with medication names using various fonts, backgrounds, and distortions
2. **Enhanced OCR Processing**: Multiple preprocessing techniques to improve OCR accuracy
3. **Dictionary-Based Correction**: Post-processing to correct OCR results using known medication names
4. **Performance Evaluation**: Comprehensive metrics and visualizations to measure OCR performance

## Performance Results

Our testing shows significant improvements from the baseline OCR approach:

- **Basic OCR**: 89.02% accuracy, 38/50 perfect matches
- **Enhanced OCR**: 89.04% accuracy, 43/50 perfect matches
- **Full Pipeline** (with dictionary correction): 91.74% accuracy, 45/50 perfect matches

## Key Improvements

### 1. Image Preprocessing Enhancements

- **Deskewing**: Automatic correction of rotated text using contour detection
- **Multiple Binarization Methods**: Adaptive thresholding, Otsu's method, and regular thresholding
- **CLAHE**: Contrast Limited Adaptive Histogram Equalization for better contrast
- **Noise Reduction**: Advanced denoising techniques

### 2. OCR Configuration Optimization

- **Multiple Tesseract Modes**: Testing different Page Segmentation Modes (PSM) and OCR Engine Modes (OEM)
- **Ensemble Approach**: Combining results from multiple preprocessing and configuration combinations

### 3. Advanced Dictionary Matching

- **N-gram Matching**: Breaking down text into character n-grams for better partial matches
- **Multiple Fuzzy Algorithms**: Token sort ratio, partial ratio, token set ratio
- **Prefix Matching**: Special handling for partial medication names

## Usage

To run the OCR testing framework:

```bash
# Activate the virtual environment
source ocr_env/bin/activate

# Run the OCR testing script
python ocr_medication_test.py
```

This will:
1. Generate synthetic test images with Indian medication names
2. Process the images using different OCR pipelines
3. Evaluate and compare the performance of each approach
4. Save detailed results and visualizations

## Requirements

The following dependencies are required:

- OpenCV (>=4.7.0)
- NumPy (>=1.24.3)
- PyTesseract (>=0.3.10)
- FuzzyWuzzy (>=0.18.0)
- Python-Levenshtein (>=0.21.1)
- Matplotlib (>=3.7.1)
- Tesseract OCR engine (must be installed separately)

Install dependencies using:

```bash
pip install -r requirements.txt
```

## Further Improvements

Future enhancements to consider:

1. **Deep Learning OCR**: Train a specialized model for medication name recognition
2. **Prescription-Specific Processing**: Add region-of-interest detection for medication sections
3. **Additional Languages**: Support for multiple Indian languages and scripts
4. **Mobile Integration**: Optimize for mobile camera input characteristics 