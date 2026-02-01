"""
AI Service - OpenAI GPT integration for prescription parsing and report analysis
Supports vision-based analysis for images without requiring Tesseract OCR
Supports: OpenAI, Azure OpenAI, FastRouter, and other compatible providers
"""
import json
import base64
from typing import Dict, Any, List, Optional
from openai import OpenAI, AzureOpenAI

from app.config import settings


class AIService:
    """
    AI Service for parsing prescriptions and analyzing health reports using OpenAI-compatible APIs
    Supports: OpenAI, Azure OpenAI, NuGen, OpenRouter, and other compatible providers
    """
    
    def __init__(self):
        """Initialize AI client (OpenAI-compatible or Azure)"""
        self.client = None
        self.vision_client = None  # Separate client for vision tasks
        self.model = settings.OPENAI_MODEL
        self.vision_model = settings.OPENAI_MODEL
        
        # Try Azure OpenAI first
        if settings.AI_PROVIDER == "azure" and (settings.AZURE_OPENAI_KEY or settings.AZURE_OPENAI_API_KEY):
            api_key = settings.AZURE_OPENAI_KEY or settings.AZURE_OPENAI_API_KEY
            if settings.AZURE_OPENAI_ENDPOINT:
                print(f"[AI] Using Azure OpenAI: {settings.AZURE_DEPLOYMENT_NAME}")
                self.client = AzureOpenAI(
                    api_key=api_key,
                    api_version=settings.AZURE_API_VERSION,
                    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
                )
                self.model = settings.AZURE_DEPLOYMENT_NAME
                # Use same client for vision (gpt-4o supports vision)
                self.vision_client = self.client
                self.vision_model = settings.AZURE_DEPLOYMENT_NAME
        # Fall back to OpenAI-compatible (FastRouter, OpenRouter, etc.)
        elif settings.OPENAI_API_KEY:
            if settings.OPENAI_BASE_URL:
                print(f"[AI] Using OpenAI-compatible API: {settings.OPENAI_BASE_URL}")
                self.client = OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    base_url=settings.OPENAI_BASE_URL
                )
                self.vision_client = self.client
            else:
                print("[AI] Using OpenAI API")
                self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
                self.vision_client = self.client
        else:
            print("[AI] No AI provider configured - using mock responses")
        
        # Also set up FastRouter as backup for vision if Azure doesn't work
        if settings.OPENAI_API_KEY and settings.OPENAI_BASE_URL:
            self.fastrouter_client = OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL
            )
            self.fastrouter_model = settings.OPENAI_MODEL
            print(f"[AI] FastRouter backup configured: {settings.OPENAI_MODEL}")
        else:
            self.fastrouter_client = None
            self.fastrouter_model = None
    
    async def parse_prescription(self, ocr_text: str) -> Dict[str, Any]:
        """
        Parse prescription text using GPT to extract structured medicine data
        
        Args:
            ocr_text: Raw text extracted from prescription via OCR
            
        Returns:
            Structured prescription data
        """
        if not self.client or not ocr_text or len(ocr_text.strip()) < 10:
            # return self._mock_prescription_parse(ocr_text)
            print("[AI WARNING] Client not ready or text too short, but attempting anyway...")
        
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
            # return self._mock_prescription_parse(ocr_text)
            raise Exception("JSON Decode Error in AI response")
        except Exception as e:
            print(f"AI parsing error: {str(e)}")
            # return self._mock_prescription_parse(ocr_text)
            raise e
    
    async def parse_prescription_from_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Parse prescription directly from image using Vision AI
        This bypasses OCR and uses the AI's vision capabilities
        
        Args:
            image_bytes: Raw bytes of the image file
            
        Returns:
            Structured prescription data
        """
        if not self.client and not self.fastrouter_client:
            print("[AI] No client available - normally would return demo data")
            # return self._get_demo_prescription_data()
            raise Exception("No AI client available")
        
        # Encode image to base64
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = """Analyze this prescription image and extract all medicine information.

Return a JSON object with this exact structure:
{
    "doctor_name": "Dr. Name if visible",
    "hospital_name": "Hospital/Clinic name if visible",
    "patient_name": "Patient name if visible",
    "date": "Date in YYYY-MM-DD format if visible",
    "diagnosis": "Diagnosis if mentioned",
    "medicines": [
        {
            "name": "Medicine name",
            "dosage": "Dosage (e.g., 500mg)",
            "frequency": "How often (e.g., twice daily)",
            "timing": ["morning", "night"],
            "duration_days": 7,
            "instructions": "Any special instructions"
        }
    ],
    "notes": "Any additional notes or instructions",
    "follow_up_date": "Follow-up date if mentioned"
}

Extract ALL medicines you can see. If you cannot read something clearly, make your best guess.
Return ONLY valid JSON, no other text."""

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]

        # Try primary client (Azure or configured client)
        try:
            if self.vision_client:
                print(f"[AI] Parsing prescription image ({len(image_bytes)} bytes) with {self.vision_model}...")
                
                response = self.vision_client.chat.completions.create(
                    model=self.vision_model,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=2000
                )
                
                result_text = response.choices[0].message.content.strip()
                
                # Safe logging to avoid charmap errors
                safe_log = result_text.encode('ascii', 'backslashreplace').decode('ascii')
                print(f"[AI] Raw response: {safe_log[:200]}...")
                
                # Clean up JSON if wrapped in markdown code blocks
                if result_text.startswith('```'):
                    lines = result_text.split('\n')

                    result_text = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])
                    result_text = result_text.strip()
                
                parsed = json.loads(result_text)
                print(f"[AI] Successfully parsed prescription with {len(parsed.get('medicines', []))} medicines")
                return parsed
                
        except Exception as e:
            print(f"[AI ERROR] Primary vision client failed: {str(e)}")
        
        # Try FastRouter backup
        if self.fastrouter_client:
            try:
                print(f"[AI] Trying FastRouter backup with {self.fastrouter_model}...")
                
                response = self.fastrouter_client.chat.completions.create(
                    model=self.fastrouter_model,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=2000
                )
                
                result_text = response.choices[0].message.content.strip()
                
                # Safe logging
                safe_log = result_text.encode('ascii', 'backslashreplace').decode('ascii')
                print(f"[AI] FastRouter response: {safe_log[:200]}...")
                
                # Clean up JSON
                if result_text.startswith('```'):
                    lines = result_text.split('\n')
                    result_text = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])
                    result_text = result_text.strip()
                
                parsed = json.loads(result_text)
                print(f"[AI] FastRouter parsed prescription with {len(parsed.get('medicines', []))} medicines")
                return parsed
                
            except Exception as e:
                print(f"[AI ERROR] FastRouter also failed: {str(e)}")
                raise e
        
        # All failed - return demo data
        print("[AI] All AI providers failed - returning demo data")
        # return self._get_demo_prescription_data()
        raise Exception("All AI providers failed to parse image")
    
    async def analyze_health_report(self, ocr_text: str, report_type: str = "other") -> Dict[str, Any]:
        """
        Analyze health report using GPT to extract lab values and generate insights
        """
        if not self.client or not ocr_text or len(ocr_text.strip()) < 10:
            # return self._mock_report_analysis(ocr_text, report_type)
            print("[AI WARNING] Client not ready or text too short")
        
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
                    {"role": "system", "content": "You are a medical report analyzer. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            result_text = response.choices[0].message.content.strip()
            
            if result_text.startswith('```'):
                result_text = result_text.split('```')[1]
                if result_text.startswith('json'):
                    result_text = result_text[4:]
            
            return json.loads(result_text)
            
        except Exception as e:
            print(f"AI analysis error: {str(e)}")
            # return self._mock_report_analysis(ocr_text, report_type)
            raise e
    
    async def analyze_report_from_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze health report directly from image using Vision AI
        """
        if not self.client:
            print("[AI WARNING] Client not configured - normally would return demo data")
            # return self._get_demo_report_data()
            raise Exception("No AI client configured for report analysis")
        
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = """Analyze this health/lab report image and extract all information.

Return a JSON object with this structure:
{
    "lab_values": {
        "test_name": {
            "value": 12.5,
            "unit": "g/dL",
            "normal_range": "12.0-16.0",
            "status": "normal"
        }
    },
    "summary": "Brief 2-3 sentence summary explaining the results in simple terms",
    "risk_level": "normal",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
}

Extract ALL lab values you can see. Use status: "normal", "borderline_high", "borderline_low", "high", or "low".
Return ONLY valid JSON."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            result_text = response.choices[0].message.content.strip()
            
            if result_text.startswith('```'):
                lines = result_text.split('\n')
                result_text = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])
                result_text = result_text.strip()
            
            return json.loads(result_text)
            
        except Exception as e:
            print(f"Vision AI report analysis error: {str(e)}")
            # return self._get_demo_report_data()
            raise e
    
    def _mock_prescription_parse(self, ocr_text: str) -> Dict[str, Any]:
        """Mock prescription parsing when OpenAI is not available"""
        medicines = []
        lines = ocr_text.split('\n') if ocr_text else []
        
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
            "medicines": medicines[:10],
            "notes": "Parsed without AI - please verify",
            "follow_up_date": None
        }
    
    def _mock_report_analysis(self, ocr_text: str, report_type: str) -> Dict[str, Any]:
        """Mock report analysis when OpenAI is not available"""
        return {
            "lab_values": {},
            "summary": "Report uploaded successfully. AI analysis not available - please consult your doctor.",
            "risk_level": "normal",
            "key_findings": ["Report requires manual review"],
            "recommendations": ["Consult your healthcare provider for detailed analysis"],
            "follow_up_needed": True,
            "abnormal_values": []
        }
    
    def _get_demo_prescription_data(self) -> Dict[str, Any]:
        """Return demo prescription data for hackathon"""
        return {
            "doctor_name": "Dr. Sarah Johnson, MD",
            "hospital_name": "City Medical Center",
            "patient_name": "Patient",
            "date": "2024-01-31",
            "diagnosis": "Upper Respiratory Infection",
            "medicines": [
                {
                    "name": "Amoxicillin",
                    "dosage": "500mg",
                    "frequency": "3 times daily",
                    "timing": ["morning", "afternoon", "night"],
                    "duration_days": 7,
                    "instructions": "Take after meals"
                },
                {
                    "name": "Paracetamol",
                    "dosage": "650mg",
                    "frequency": "As needed for fever",
                    "timing": ["morning", "night"],
                    "duration_days": 5,
                    "instructions": "Maximum 4 tablets per day"
                },
                {
                    "name": "Cetirizine",
                    "dosage": "10mg",
                    "frequency": "Once daily",
                    "timing": ["night"],
                    "duration_days": 7,
                    "instructions": "May cause drowsiness"
                }
            ],
            "notes": "Drink plenty of fluids. Rest advised. Return if symptoms worsen.",
            "follow_up_date": "2024-02-07"
        }
    
    def _get_demo_report_data(self) -> Dict[str, Any]:
        """Return demo report data for hackathon"""
        return {
            "summary": "Blood test results show generally healthy values. Vitamin D is slightly low - consider supplementation. Cholesterol is borderline high - dietary modifications recommended.",
            "risk_level": "normal",
            "lab_values": {
                "hemoglobin": {"value": 14.2, "unit": "g/dL", "status": "normal", "normal_range": "13.5-17.5"},
                "rbc_count": {"value": 4.9, "unit": "million/µL", "status": "normal", "normal_range": "4.5-5.5"},
                "wbc_count": {"value": 7500, "unit": "/µL", "status": "normal", "normal_range": "4500-11000"},
                "platelets": {"value": 250000, "unit": "/µL", "status": "normal", "normal_range": "150000-400000"},
                "blood_sugar_fasting": {"value": 95, "unit": "mg/dL", "status": "normal", "normal_range": "70-100"},
                "cholesterol_total": {"value": 210, "unit": "mg/dL", "status": "borderline_high", "normal_range": "<200"},
                "vitamin_d": {"value": 22, "unit": "ng/mL", "status": "low", "normal_range": "30-100"}
            },
            "recommendations": [
                "Start Vitamin D3 supplementation (1000-2000 IU daily)",
                "Reduce saturated fat intake to lower cholesterol",
                "Increase physical activity to 30 minutes daily",
                "Retest cholesterol in 3 months"
            ]
        }
    
    async def translate_and_simplify(
        self, 
        content: Dict[str, Any], 
        target_language: str = "hindi",
        content_type: str = "report"
    ) -> Dict[str, Any]:
        """
        Translate and simplify medical content to Hindi or Marathi
        Makes it easy for patients to understand in their local language
        
        Args:
            content: The analysis/parsed data to translate
            target_language: "hindi" or "marathi"
            content_type: "report" or "prescription"
        """
        if not self.client:
            return self._get_demo_translation(content, target_language, content_type)
        
        language_name = "Hindi (हिंदी)" if target_language == "hindi" else "Marathi (मराठी)"
        
        if content_type == "report":
            prompt = f"""You are a medical translator who simplifies health reports for patients.

Translate and simplify this health report analysis into {language_name}.
Make it very easy to understand for a common person with no medical background.
Use simple everyday language, avoid medical jargon.

Original Report Analysis:
{json.dumps(content, indent=2)}

Return a JSON object with this structure:
{{
    "summary_translated": "Simple summary in {language_name}",
    "risk_level_translated": "Risk level explained simply in {language_name}",
    "key_findings_translated": ["Finding 1 in simple {language_name}", "Finding 2"],
    "recommendations_translated": ["What to do - in simple {language_name}"],
    "doctor_advice": "When to see a doctor - in {language_name}",
    "lifestyle_tips": ["Simple lifestyle tip in {language_name}"],
    "original_language": "english",
    "translated_language": "{target_language}"
}}

Important: 
- Use very simple words that a village person can understand
- Explain what each test means for their health
- Give practical advice they can follow at home
- Be reassuring but honest

Return ONLY valid JSON."""
        else:  # prescription
            prompt = f"""You are a medical translator who helps patients understand prescriptions.

Translate and simplify this prescription into {language_name}.
Make it very easy to understand for a common person.

Original Prescription:
{json.dumps(content, indent=2)}

Return a JSON object with this structure:
{{
    "medicines_translated": [
        {{
            "name": "Medicine name",
            "name_translated": "Medicine name in {language_name} (if available)",
            "dosage_simple": "How much to take - in simple {language_name}",
            "when_to_take": "When to take - in simple {language_name}",
            "duration": "For how long - in {language_name}",
            "food_instructions": "Before or after food - in {language_name}",
            "warnings": "What to avoid - in {language_name}"
        }}
    ],
    "diagnosis_translated": "What illness you have - in simple {language_name}",
    "general_instructions": "Overall instructions in {language_name}",
    "follow_up_translated": "When to visit doctor again - in {language_name}",
    "emergency_signs": "When to go to hospital immediately - in {language_name}",
    "original_language": "english",
    "translated_language": "{target_language}"
}}

Important:
- Use words a common person understands
- Be very clear about medicine timing
- Include warnings about side effects in simple terms

Return ONLY valid JSON."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": f"You are a helpful medical translator. Always respond in {language_name} with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=3000
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Clean up JSON if wrapped in markdown code blocks
            if result_text.startswith('```'):
                lines = result_text.split('\n')
                result_text = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])
                result_text = result_text.strip()
            
            # Additional cleanup for non-JSON text
            if not result_text.startswith('{'):
                # Try to find JSON block
                import re
                json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
                if json_match:
                    result_text = json_match.group(0)
            
            # Ensure proper encoding
            if hasattr(result_text, 'encode'):
                # Just print a safe version for logs, keep original for parsing
                safe_log = result_text.encode('ascii', 'backslashreplace').decode('ascii')
                print(f"[AI] Raw response (safe): {safe_log[:200]}...")
            
            return json.loads(result_text)
            
        except Exception as e:
            print(f"Translation error: {str(e)}")
            return self._get_demo_translation(content, target_language, content_type)
    
    def _get_demo_translation(
        self, 
        content: Dict[str, Any], 
        target_language: str,
        content_type: str
    ) -> Dict[str, Any]:
        """Demo translation data when AI is not available"""
        if target_language == "hindi":
            if content_type == "report":
                return {
                    "summary_translated": "आपकी रिपोर्ट सामान्य है। विटामिन डी थोड़ा कम है, इसके लिए सप्लीमेंट लें। कोलेस्ट्रॉल थोड़ा बढ़ा है, खाने में तेल कम करें।",
                    "risk_level_translated": "सामान्य - चिंता की कोई बात नहीं",
                    "key_findings_translated": [
                        "खून की मात्रा सही है",
                        "शुगर लेवल नॉर्मल है",
                        "विटामिन डी कम है - धूप में बैठें",
                        "कोलेस्ट्रॉल थोड़ा ज्यादा है"
                    ],
                    "recommendations_translated": [
                        "रोज़ाना 30 मिनट धूप में बैठें",
                        "तला हुआ खाना कम खाएं",
                        "रोज़ 30 मिनट टहलें",
                        "3 महीने बाद दोबारा टेस्ट कराएं"
                    ],
                    "doctor_advice": "अगर कमज़ोरी या थकान महसूस हो तो डॉक्टर से मिलें",
                    "lifestyle_tips": [
                        "सुबह जल्दी उठें और टहलें",
                        "हरी सब्ज़ियां ज़्यादा खाएं",
                        "पानी खूब पिएं",
                        "रात को जल्दी सोएं"
                    ],
                    "original_language": "english",
                    "translated_language": "hindi"
                }
            else:
                return {
                    "medicines_translated": [
                        {
                            "name": "Amoxicillin",
                            "name_translated": "एमोक्सिसिलिन (एंटीबायोटिक)",
                            "dosage_simple": "एक गोली (500mg)",
                            "when_to_take": "सुबह, दोपहर और रात को - दिन में 3 बार",
                            "duration": "7 दिन तक लगातार लें",
                            "food_instructions": "खाना खाने के बाद लें",
                            "warnings": "दवाई बीच में न छोड़ें, पूरा कोर्स करें"
                        }
                    ],
                    "diagnosis_translated": "सर्दी-खांसी का इन्फेक्शन है",
                    "general_instructions": "आराम करें, गरम पानी पिएं, तली चीज़ें न खाएं",
                    "follow_up_translated": "7 दिन बाद डॉक्टर को दिखाएं",
                    "emergency_signs": "अगर तेज़ बुखार हो या सांस लेने में तकलीफ हो तो तुरंत अस्पताल जाएं",
                    "original_language": "english",
                    "translated_language": "hindi"
                }
        else:  # Marathi
            if content_type == "report":
                return {
                    "summary_translated": "तुमचा रिपोर्ट सामान्य आहे. व्हिटॅमिन डी थोडे कमी आहे, त्यासाठी सप्लिमेंट घ्या. कोलेस्ट्रॉल थोडे वाढले आहे, जेवणात तेल कमी करा.",
                    "risk_level_translated": "सामान्य - काळजी करण्याचे कारण नाही",
                    "key_findings_translated": [
                        "रक्ताचे प्रमाण योग्य आहे",
                        "साखरेची पातळी नॉर्मल आहे",
                        "व्हिटॅमिन डी कमी आहे - उन्हात बसा",
                        "कोलेस्ट्रॉल थोडे जास्त आहे"
                    ],
                    "recommendations_translated": [
                        "रोज 30 मिनिटे उन्हात बसा",
                        "तळलेले पदार्थ कमी खा",
                        "रोज 30 मिनिटे चाला",
                        "3 महिन्यांनी पुन्हा तपासणी करा"
                    ],
                    "doctor_advice": "अशक्तपणा किंवा थकवा जाणवल्यास डॉक्टरांना भेटा",
                    "lifestyle_tips": [
                        "सकाळी लवकर उठा आणि चाला",
                        "हिरव्या भाज्या जास्त खा",
                        "भरपूर पाणी प्या",
                        "रात्री लवकर झोपा"
                    ],
                    "original_language": "english",
                    "translated_language": "marathi"
                }
            else:
                return {
                    "medicines_translated": [
                        {
                            "name": "Amoxicillin",
                            "name_translated": "अमॉक्सिसिलिन (अँटीबायोटिक)",
                            "dosage_simple": "एक गोळी (500mg)",
                            "when_to_take": "सकाळी, दुपारी आणि रात्री - दिवसातून 3 वेळा",
                            "duration": "7 दिवस सतत घ्या",
                            "food_instructions": "जेवणानंतर घ्या",
                            "warnings": "औषध मध्येच थांबवू नका, पूर्ण कोर्स करा"
                        }
                    ],
                    "diagnosis_translated": "सर्दी-खोकल्याचा संसर्ग आहे",
                    "general_instructions": "आराम करा, गरम पाणी प्या, तळलेले पदार्थ खाऊ नका",
                    "follow_up_translated": "7 दिवसांनी डॉक्टरांना दाखवा",
                    "emergency_signs": "जर खूप ताप आला किंवा श्वास घेण्यास त्रास झाला तर लगेच हॉस्पिटलला जा",
                    "original_language": "english",
                    "translated_language": "marathi"
                }


# Singleton instance
ai_service = AIService()


class DrugInteractionSafetyEngine:
    """
    AI Drug Interaction Safety Engine for MediTrack AI
    Uses Azure OpenAI / FastRouter to detect dangerous drug interactions
    """
    
    def __init__(self):
        """Initialize using existing AI service client"""
        self.client = ai_service.client
        self.model = ai_service.model
    
    def check_drug_interactions(
        self, 
        new_meds: List[Dict[str, Any]], 
        existing_meds: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Check for dangerous drug interactions between new and existing medications
        
        Args:
            new_meds: List of newly prescribed medicines
            existing_meds: List of currently active medicines
            
        Returns:
            Safety Alert JSON with interaction details
        """
        from datetime import datetime
        
        # Extract medicine names
        new_med_names = [med.get('name', '') for med in new_meds]
        existing_med_names = [med.get('name', '') for med in existing_meds]
        
        # If no client or no medications to check, return safe
        if not self.client:
            return self.get_demo_interaction_alert()
        
        if not new_med_names and not existing_med_names:
            return {
                "has_critical_interactions": False,
                "safety_level": "SAFE",
                "interaction_alerts": [],
                "safe_combinations": [],
                "overall_recommendation": "No medications to check.",
                "emergency_warning": None,
                "consult_doctor": False,
                "confidence_score": 1.0,
                "checked_at": datetime.utcnow().isoformat(),
                "total_medications_checked": 0
            }
        
        # AI Prompt for Interaction Analysis
        prompt = f"""You are a pharmaceutical safety AI analyzing drug interactions for patient safety.

NEW PRESCRIPTIONS: {json.dumps(new_med_names)}
CURRENTLY TAKING: {json.dumps(existing_med_names)}

Analyze if there are ANY dangerous interactions between the NEW prescriptions and CURRENTLY TAKING medicines.

Return ONLY a JSON object (no markdown, no code blocks) with this EXACT structure:

{{
  "has_critical_interactions": true or false,
  "safety_level": "SAFE" or "CAUTION" or "DANGER" or "CRITICAL",
  "interaction_alerts": [
    {{
      "drug_1": "medicine name from new prescriptions",
      "drug_2": "medicine name from currently taking",
      "severity": "mild" or "moderate" or "severe" or "life-threatening",
      "risk_description": "clear explanation of what happens when these interact",
      "symptoms_to_watch": ["symptom 1", "symptom 2"],
      "action_required": "IMMEDIATE: See doctor" or "URGENT: Call doctor" or "MONITOR: Watch for symptoms" or "OK: Continue as prescribed",
      "time_separation": "if medicines can be taken at different times to avoid interaction, specify hours (e.g., '4 hours apart') or null",
      "clinical_note": "medical explanation for healthcare provider"
    }}
  ],
  "safe_combinations": ["list of new medicines that are safe with current medications"],
  "overall_recommendation": "Clear action statement for patient",
  "emergency_warning": "IF life-threatening interaction detected, provide URGENT warning text, else null",
  "consult_doctor": true or false,
  "confidence_score": 0.0 to 1.0
}}

CRITICAL SAFETY RULES:
1. Mark as "CRITICAL" if interaction can cause: death, organ failure, severe bleeding, heart problems
2. Mark as "DANGER" if interaction causes: hospitalization risk, severe side effects
3. Mark as "CAUTION" if interaction causes: increased side effects, reduced effectiveness
4. Mark as "SAFE" only if NO interactions detected
5. Be conservative - patient safety is PRIORITY
6. If unsure, recommend consulting doctor

Common critical interactions to watch for:
- Blood thinners (Warfarin) + NSAIDs (Aspirin, Ibuprofen)
- MAO Inhibitors + SSRIs (Serotonin Syndrome)
- Statins + certain antibiotics
- Diabetes meds + other drugs affecting blood sugar
- Blood pressure meds + other BP-affecting drugs"""

        try:
            # Call AI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a pharmaceutical safety AI. Patient lives depend on your accuracy. Return ONLY valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,  # Very low for medical safety
                max_tokens=2000
            )
            
            # Extract and clean response
            ai_response = response.choices[0].message.content
            
            # Remove markdown if present
            cleaned = ai_response.strip()
            if '```json' in cleaned:
                cleaned = cleaned.split('```json')[1].split('```')[0].strip()
            elif '```' in cleaned:
                cleaned = cleaned.split('```')[1].split('```')[0].strip()
            
            # Parse JSON
            safety_alert = json.loads(cleaned)
            
            # Add metadata
            safety_alert['checked_at'] = datetime.utcnow().isoformat()
            safety_alert['total_medications_checked'] = len(new_med_names) + len(existing_med_names)
            
            return safety_alert
            
        except Exception as e:
            print(f"[DRUG SAFETY] AI check failed: {str(e)}")
            # Failsafe - if AI fails, return cautionary alert
            return {
                "has_critical_interactions": True,
                "safety_level": "CAUTION",
                "interaction_alerts": [{
                    "drug_1": "New Prescription",
                    "drug_2": "Existing Medication",
                    "severity": "unknown",
                    "risk_description": f"Unable to verify safety due to system error: {str(e)}",
                    "action_required": "URGENT: Consult your doctor before taking new medications",
                    "symptoms_to_watch": [],
                    "time_separation": None,
                    "clinical_note": "AI safety check failed - manual review required"
                }],
                "safe_combinations": [],
                "overall_recommendation": "DO NOT take new medications until doctor confirms safety",
                "emergency_warning": "SYSTEM ERROR - Manual verification required",
                "consult_doctor": True,
                "confidence_score": 0.0,
                "checked_at": datetime.utcnow().isoformat(),
                "total_medications_checked": len(new_med_names) + len(existing_med_names),
                "error": str(e)
            }
    
    def get_demo_interaction_alert(self) -> Dict[str, Any]:
        """
        Demo mode: Return a realistic critical interaction alert
        Perfect for hackathon demo without API delays
        """
        from datetime import datetime
        return {
            "has_critical_interactions": True,
            "safety_level": "DANGER",
            "interaction_alerts": [
                {
                    "drug_1": "Aspirin",
                    "drug_2": "Warfarin",
                    "severity": "severe",
                    "risk_description": "Taking Aspirin with Warfarin significantly increases bleeding risk. Both are blood thinners and their combined effect can lead to dangerous internal bleeding.",
                    "symptoms_to_watch": [
                        "Unusual bruising",
                        "Blood in urine or stool",
                        "Prolonged bleeding from cuts",
                        "Severe headache",
                        "Dizziness or weakness"
                    ],
                    "action_required": "URGENT: Call your doctor before taking Aspirin",
                    "time_separation": None,
                    "clinical_note": "Combined anticoagulant effect increases INR significantly. Consider alternative pain management."
                }
            ],
            "safe_combinations": ["Paracetamol (safer alternative for pain)"],
            "overall_recommendation": "DO NOT take Aspirin while on Warfarin without doctor approval. Use Paracetamol for pain instead.",
            "emergency_warning": "⚠️ DANGEROUS INTERACTION DETECTED: Risk of severe bleeding. Contact your doctor immediately.",
            "consult_doctor": True,
            "confidence_score": 0.97,
            "checked_at": datetime.utcnow().isoformat(),
            "total_medications_checked": 5
        }


# Singleton instance for drug safety
drug_safety_engine = DrugInteractionSafetyEngine()


def get_drug_safety_engine() -> DrugInteractionSafetyEngine:
    """Get the drug safety engine instance"""
    return drug_safety_engine

