"""
Validation functions for MediTrack Backend
"""
import re
from typing import Optional, List, Tuple
from datetime import date, datetime
from email_validator import validate_email, EmailNotValidError


def validate_email_address(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email address format
    
    Args:
        email: Email address to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        validate_email(email, check_deliverability=False)
        return True, None
    except EmailNotValidError as e:
        return False, str(e)


def validate_phone_number(phone: str) -> Tuple[bool, Optional[str]]:
    """
    Validate phone number format
    
    Args:
        phone: Phone number to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Remove spaces, dashes, and parentheses
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    
    # Check if it starts with + and country code or is a 10-digit number
    if re.match(r'^\+\d{10,15}$', cleaned):
        return True, None
    
    if re.match(r'^\d{10,12}$', cleaned):
        return True, None
    
    return False, "Phone number must be 10-12 digits or include country code (e.g., +919876543210)"


def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validate password strength
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    return True, None


def validate_dosage(dosage: str) -> Tuple[bool, Optional[str]]:
    """
    Validate medicine dosage format
    
    Args:
        dosage: Dosage string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not dosage:
        return True, None  # Optional field
    
    # Common dosage patterns
    patterns = [
        r'^\d+(\.\d+)?\s*(mg|g|ml|mcg|iu|tablet|tab|capsule|cap)s?$',
        r'^\d+\s*/\s*\d+\s*(mg|g|ml)$',  # e.g., "500/125 mg"
        r'^\d+\s*-\s*\d+\s*(mg|g|ml)$',  # e.g., "250-500 mg"
    ]
    
    dosage_lower = dosage.lower().strip()
    
    for pattern in patterns:
        if re.match(pattern, dosage_lower, re.IGNORECASE):
            return True, None
    
    # Accept any non-empty string as it might be a valid format we haven't covered
    if len(dosage.strip()) > 0:
        return True, None
    
    return False, "Invalid dosage format"


def validate_frequency(frequency: str) -> Tuple[bool, Optional[str]]:
    """
    Validate medicine frequency format
    
    Args:
        frequency: Frequency string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not frequency:
        return True, None  # Optional field
    
    valid_frequencies = [
        "once daily",
        "twice daily",
        "thrice daily",
        "once a day",
        "twice a day",
        "three times a day",
        "four times a day",
        "every 4 hours",
        "every 6 hours",
        "every 8 hours",
        "every 12 hours",
        "as needed",
        "when required",
        "sos",
    ]
    
    frequency_lower = frequency.lower().strip()
    
    # Check exact match
    if frequency_lower in valid_frequencies:
        return True, None
    
    # Check for "X times daily" pattern
    if re.match(r'^\d+\s*times?\s*(daily|a day|per day)$', frequency_lower):
        return True, None
    
    # Check for "every X hours" pattern
    if re.match(r'^every\s*\d+\s*hours?$', frequency_lower):
        return True, None
    
    # Accept any non-empty string
    if len(frequency.strip()) > 0:
        return True, None
    
    return False, "Invalid frequency format"


def validate_timing(timing: List[str]) -> Tuple[bool, Optional[str]]:
    """
    Validate medicine timing list
    
    Args:
        timing: List of timing strings
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not timing:
        return True, None  # Optional field
    
    valid_timings = [
        "morning",
        "afternoon",
        "evening",
        "night",
        "bedtime",
        "before_breakfast",
        "after_breakfast",
        "before_lunch",
        "after_lunch",
        "before_dinner",
        "after_dinner",
        "with_food",
        "empty_stomach",
        "as_needed",
    ]
    
    for t in timing:
        if t.lower().replace(' ', '_') not in valid_timings:
            return False, f"Invalid timing '{t}'. Valid options: {', '.join(valid_timings)}"
    
    return True, None


def validate_date_range(start_date: date, end_date: date) -> Tuple[bool, Optional[str]]:
    """
    Validate that end date is after start date
    
    Args:
        start_date: Start date
        end_date: End date
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if end_date < start_date:
        return False, "End date must be after start date"
    
    return True, None


def validate_duration_days(duration: int) -> Tuple[bool, Optional[str]]:
    """
    Validate medicine duration in days
    
    Args:
        duration: Number of days
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if duration < 1:
        return False, "Duration must be at least 1 day"
    
    if duration > 365:
        return False, "Duration cannot exceed 365 days"
    
    return True, None


def validate_file_type(content_type: str, allowed_types: List[str] = None) -> Tuple[bool, Optional[str]]:
    """
    Validate file content type
    
    Args:
        content_type: MIME type of the file
        allowed_types: List of allowed MIME types
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if allowed_types is None:
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "application/pdf"
        ]
    
    if content_type not in allowed_types:
        return False, f"File type '{content_type}' not allowed. Allowed types: {', '.join(allowed_types)}"
    
    return True, None


def validate_file_size(size_bytes: int, max_size_mb: int = 10) -> Tuple[bool, Optional[str]]:
    """
    Validate file size
    
    Args:
        size_bytes: File size in bytes
        max_size_mb: Maximum allowed size in MB
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    max_bytes = max_size_mb * 1024 * 1024
    
    if size_bytes > max_bytes:
        return False, f"File size exceeds {max_size_mb}MB limit"
    
    return True, None


def validate_lab_value(value: float, min_val: float = None, max_val: float = None) -> Tuple[bool, Optional[str]]:
    """
    Validate lab value is within reasonable bounds
    
    Args:
        value: The lab value
        min_val: Minimum possible value
        max_val: Maximum possible value
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if min_val is not None and value < min_val:
        return False, f"Value {value} is below minimum {min_val}"
    
    if max_val is not None and value > max_val:
        return False, f"Value {value} exceeds maximum {max_val}"
    
    return True, None


def validate_report_type(report_type: str) -> Tuple[bool, Optional[str]]:
    """
    Validate health report type
    
    Args:
        report_type: Type of report
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    valid_types = [
        "cbc",
        "lft",
        "kft",
        "lipid",
        "thyroid",
        "diabetes",
        "urine",
        "xray",
        "mri",
        "ct_scan",
        "ecg",
        "other"
    ]
    
    if report_type.lower() not in valid_types:
        return False, f"Invalid report type. Valid types: {', '.join(valid_types)}"
    
    return True, None


def validate_risk_level(risk_level: str) -> Tuple[bool, Optional[str]]:
    """
    Validate risk level classification
    
    Args:
        risk_level: Risk level string
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    valid_levels = ["normal", "warning", "critical"]
    
    if risk_level.lower() not in valid_levels:
        return False, f"Invalid risk level. Valid levels: {', '.join(valid_levels)}"
    
    return True, None


def sanitize_input(text: str, max_length: int = 1000) -> str:
    """
    Sanitize text input to prevent injection attacks
    
    Args:
        text: Input text
        max_length: Maximum allowed length
        
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\']', '', text)
    
    # Limit length
    sanitized = sanitized[:max_length]
    
    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')
    
    return sanitized.strip()


class ValidationError(Exception):
    """Custom validation error"""
    
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(self.message)


def validate_prescription_data(data: dict) -> Tuple[bool, List[str]]:
    """
    Validate prescription upload data
    
    Args:
        data: Prescription data dictionary
        
    Returns:
        Tuple of (is_valid, list of errors)
    """
    errors = []
    
    # Validate medicines if present
    if "medicines" in data:
        for i, med in enumerate(data["medicines"]):
            if not med.get("name"):
                errors.append(f"Medicine {i+1}: Name is required")
            
            if med.get("dosage"):
                valid, err = validate_dosage(med["dosage"])
                if not valid:
                    errors.append(f"Medicine {i+1}: {err}")
            
            if med.get("frequency"):
                valid, err = validate_frequency(med["frequency"])
                if not valid:
                    errors.append(f"Medicine {i+1}: {err}")
            
            if med.get("timing"):
                valid, err = validate_timing(med["timing"])
                if not valid:
                    errors.append(f"Medicine {i+1}: {err}")
            
            if med.get("duration_days"):
                valid, err = validate_duration_days(med["duration_days"])
                if not valid:
                    errors.append(f"Medicine {i+1}: {err}")
    
    return len(errors) == 0, errors
