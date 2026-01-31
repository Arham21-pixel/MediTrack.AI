"""
AI Service - OpenAI GPT integration for prescription parsing and report analysis
"""
import json
from typing import Dict, Any, List, Optional
from openai import OpenAI

from app.config import settings


class AIService:
    """
    AI Service for parsing prescriptions and analyzing health reports using OpenAI GPT
    """
    
    def __init__(self):
        """Initialize OpenAI client"""
        self.client = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
    
    async def parse_prescription(self, ocr_text: str) -> Dict[str, Any]:
        """
        Parse prescription text using GPT to extract structured medicine data
        
        Args:
            ocr_text: Raw text extracted from prescription via OCR
            
        Returns:
            Structured prescription data
        """
        if not self.client:
            return self._mock_prescription_parse(ocr_text)
        
        prompt = f"""You are a medical prescription parser. Extract structured information from the following prescription text.

Return a JSON object with this exact structure:
{{
    "doctor_name": "Dr. Name if found",
    "hospital_name": "Hospital/Clinic name if found",
    "patient_name": "Patient name if found",
    "date": "Date in YYYY-MM-DD format if found",
    "diagnosis": "Diagnosis if mentioned",
    "medicines": [
        {{
            "name": "Medicine name",
            "dosage": "Dosage (e.g., 500mg)",
            "frequency": "How often (e.g., twice daily)",
            "timing": ["morning", "night"],
            "duration_days": 7,
            "instructions": "Any special instructions"
        }}
    ],
    "notes": "Any additional notes",
    "follow_up_date": "Follow-up date if mentioned"
}}

For timing, use these standard values: "morning", "afternoon", "evening", "night", "before_breakfast", "after_breakfast", "before_lunch", "after_lunch", "before_dinner", "after_dinner"

Prescription text:
{ocr_text}

Return ONLY valid JSON, no other text."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a medical document parser. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Clean up JSON if wrapped in markdown code blocks
            if result_text.startswith('```'):
                result_text = result_text.split('```')[1]
                if result_text.startswith('json'):
                    result_text = result_text[4:]
            
            return json.loads(result_text)
            
        except json.JSONDecodeError:
            return self._mock_prescription_parse(ocr_text)
        except Exception as e:
            print(f"AI parsing error: {str(e)}")
            return self._mock_prescription_parse(ocr_text)
    
    async def analyze_health_report(self, ocr_text: str, report_type: str = "other") -> Dict[str, Any]:
        """
        Analyze health report using GPT to extract lab values and generate insights
        
        Args:
            ocr_text: Raw text extracted from health report via OCR
            report_type: Type of report (cbc, lft, kft, etc.)
            
        Returns:
            Analysis results with lab values and recommendations
        """
        if not self.client:
            return self._mock_report_analysis(ocr_text, report_type)
        
        prompt = f"""You are a medical report analyzer. Extract lab values and provide analysis for this {report_type} report.

Return a JSON object with this structure:
{{
    "lab_values": {{
        "test_name": {{
            "value": 12.5,
            "unit": "g/dL",
            "normal_range": "12.0-16.0",
            "status": "normal",
            "interpretation": "Within normal limits"
        }}
    }},
    "summary": "Brief 2-3 sentence summary in simple language that a patient can understand",
    "risk_level": "normal",
    "key_findings": ["Finding 1", "Finding 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "follow_up_needed": false,
    "abnormal_values": ["List of abnormal test names"]
}}

For status, use: "normal", "warning" (slightly abnormal), or "critical" (significantly abnormal)
For risk_level, use: "normal", "warning", or "critical" based on overall findings

Report text:
{ocr_text}

Return ONLY valid JSON, no other text."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a medical report analyzer. Always respond with valid JSON only. Provide clear, patient-friendly explanations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Clean up JSON
            if result_text.startswith('```'):
                result_text = result_text.split('```')[1]
                if result_text.startswith('json'):
                    result_text = result_text[4:]
            
            return json.loads(result_text)
            
        except json.JSONDecodeError:
            return self._mock_report_analysis(ocr_text, report_type)
        except Exception as e:
            print(f"AI analysis error: {str(e)}")
            return self._mock_report_analysis(ocr_text, report_type)
    
    async def generate_reminder_message(self, medicine_name: str, dosage: str, timing: str) -> str:
        """
        Generate a friendly reminder message for medicine
        
        Args:
            medicine_name: Name of the medicine
            dosage: Dosage information
            timing: When to take (morning, night, etc.)
            
        Returns:
            Friendly reminder message
        """
        if not self.client:
            return f"⏰ Time to take {medicine_name} ({dosage}). Stay healthy! 💊"
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Generate short, friendly medicine reminder messages. Use appropriate emojis. Keep it under 160 characters for SMS."},
                    {"role": "user", "content": f"Generate a {timing} reminder for {medicine_name} ({dosage})"}
                ],
                temperature=0.7,
                max_tokens=100
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception:
            return f"⏰ Time to take {medicine_name} ({dosage}). Stay healthy! 💊"
    
    async def explain_lab_value(self, test_name: str, value: float, unit: str, normal_range: str) -> str:
        """
        Generate a simple explanation for a lab value
        
        Args:
            test_name: Name of the test
            value: Test result value
            unit: Unit of measurement
            normal_range: Normal reference range
            
        Returns:
            Simple explanation
        """
        if not self.client:
            return f"{test_name}: Your value is {value} {unit}. Normal range is {normal_range}."
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Explain lab values in simple terms that anyone can understand. Be concise and reassuring when values are normal."},
                    {"role": "user", "content": f"Explain this lab result: {test_name} = {value} {unit}, normal range: {normal_range}"}
                ],
                temperature=0.3,
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception:
            return f"{test_name}: Your value is {value} {unit}. Normal range is {normal_range}."
    
    def _mock_prescription_parse(self, ocr_text: str) -> Dict[str, Any]:
        """
        Mock prescription parsing when OpenAI is not available
        """
        # Simple keyword-based extraction
        medicines = []
        lines = ocr_text.split('\n')
        
        medicine_keywords = ['tab', 'tablet', 'cap', 'capsule', 'syrup', 'mg', 'ml']
        
        for line in lines:
            line_lower = line.lower()
            if any(kw in line_lower for kw in medicine_keywords):
                medicines.append({
                    "name": line.strip()[:50],
                    "dosage": "As prescribed",
                    "frequency": "As directed",
                    "timing": ["morning", "night"],
                    "duration_days": 7,
                    "instructions": None
                })
        
        return {
            "doctor_name": None,
            "hospital_name": None,
            "patient_name": None,
            "date": None,
            "diagnosis": None,
            "medicines": medicines[:10],  # Limit to 10 medicines
            "notes": "Parsed without AI - please verify",
            "follow_up_date": None
        }
    
    def _mock_report_analysis(self, ocr_text: str, report_type: str) -> Dict[str, Any]:
        """
        Mock report analysis when OpenAI is not available
        """
        return {
            "lab_values": {},
            "summary": "Report uploaded successfully. AI analysis not available - please consult your doctor for interpretation.",
            "risk_level": "normal",
            "key_findings": ["Report requires manual review"],
            "recommendations": ["Consult your healthcare provider for detailed analysis"],
            "follow_up_needed": True,
            "abnormal_values": []
        }


# Singleton instance
ai_service = AIService()
