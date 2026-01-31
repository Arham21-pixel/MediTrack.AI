"""
OCR Service - Text extraction from images using Tesseract and optional Google Vision
"""
import io
from typing import Dict, Any, Optional
from PIL import Image
import pytesseract

from app.config import settings


class OCRService:
    """
    OCR Service for extracting text from prescription and report images
    """
    
    def __init__(self):
        """Initialize OCR service"""
        # Configure Tesseract path if needed (Windows)
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        pass
    
    async def extract_text(self, file_content: bytes) -> Dict[str, Any]:
        """
        Extract text from image using Tesseract OCR
        
        Args:
            file_content: Raw bytes of the image file
            
        Returns:
            Dictionary containing extracted text and metadata
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(file_content))
            
            # Preprocess image for better OCR
            processed_image = self._preprocess_image(image)
            
            # Extract text using Tesseract
            text = pytesseract.image_to_string(
                processed_image,
                lang='eng',
                config='--psm 6'  # Assume uniform block of text
            )
            
            # Get confidence data
            data = pytesseract.image_to_data(
                processed_image,
                lang='eng',
                output_type=pytesseract.Output.DICT
            )
            
            # Calculate average confidence
            confidences = [int(c) for c in data['conf'] if int(c) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            return {
                "text": text.strip(),
                "confidence": round(avg_confidence, 2),
                "language": "en",
                "word_count": len(text.split()),
                "success": True
            }
            
        except Exception as e:
            return {
                "text": "",
                "confidence": 0,
                "language": "en",
                "error": str(e),
                "success": False
            }
    
    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image to improve OCR accuracy
        
        Args:
            image: PIL Image object
            
        Returns:
            Preprocessed PIL Image
        """
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to grayscale
        image = image.convert('L')
        
        # Increase contrast
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        
        # Increase sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)
        
        # Binarize (convert to black and white)
        threshold = 128
        image = image.point(lambda p: 255 if p > threshold else 0)
        
        return image
    
    async def extract_text_with_layout(self, file_content: bytes) -> Dict[str, Any]:
        """
        Extract text while preserving layout information
        
        Args:
            file_content: Raw bytes of the image file
            
        Returns:
            Dictionary containing text with bounding box information
        """
        try:
            image = Image.open(io.BytesIO(file_content))
            processed_image = self._preprocess_image(image)
            
            # Get detailed OCR data with bounding boxes
            data = pytesseract.image_to_data(
                processed_image,
                lang='eng',
                output_type=pytesseract.Output.DICT
            )
            
            # Group text by lines
            lines = {}
            for i in range(len(data['text'])):
                if data['text'][i].strip():
                    line_num = data['line_num'][i]
                    if line_num not in lines:
                        lines[line_num] = {
                            'text': '',
                            'words': [],
                            'top': data['top'][i],
                            'left': data['left'][i]
                        }
                    lines[line_num]['text'] += data['text'][i] + ' '
                    lines[line_num]['words'].append({
                        'text': data['text'][i],
                        'conf': data['conf'][i],
                        'left': data['left'][i],
                        'top': data['top'][i],
                        'width': data['width'][i],
                        'height': data['height'][i]
                    })
            
            # Sort lines by vertical position
            sorted_lines = sorted(lines.values(), key=lambda x: x['top'])
            
            return {
                "lines": sorted_lines,
                "full_text": '\n'.join([l['text'].strip() for l in sorted_lines]),
                "success": True
            }
            
        except Exception as e:
            return {
                "lines": [],
                "full_text": "",
                "error": str(e),
                "success": False
            }
    
    async def detect_document_type(self, file_content: bytes) -> str:
        """
        Attempt to detect if the document is a prescription or health report
        
        Args:
            file_content: Raw bytes of the image file
            
        Returns:
            Document type: 'prescription', 'health_report', or 'unknown'
        """
        result = await self.extract_text(file_content)
        text = result.get("text", "").lower()
        
        # Keywords for prescription
        prescription_keywords = [
            'rx', 'prescription', 'tablet', 'capsule', 'mg', 'ml',
            'dosage', 'take', 'times daily', 'after food', 'before food',
            'morning', 'night', 'doctor', 'dr.', 'patient'
        ]
        
        # Keywords for health reports
        report_keywords = [
            'laboratory', 'lab report', 'blood test', 'cbc', 'hemoglobin',
            'wbc', 'rbc', 'platelet', 'cholesterol', 'glucose', 'creatinine',
            'bilirubin', 'sgpt', 'sgot', 'urea', 'reference range', 'normal range'
        ]
        
        prescription_score = sum(1 for kw in prescription_keywords if kw in text)
        report_score = sum(1 for kw in report_keywords if kw in text)
        
        if prescription_score > report_score and prescription_score >= 3:
            return 'prescription'
        elif report_score > prescription_score and report_score >= 3:
            return 'health_report'
        else:
            return 'unknown'


# Singleton instance
ocr_service = OCRService()
