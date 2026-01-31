"""
Helper functions for MediTrack Backend
"""
import re
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any, Union
from uuid import UUID
import hashlib


def generate_unique_id() -> str:
    """Generate a unique identifier"""
    from uuid import uuid4
    return str(uuid4())


def format_date(d: Union[date, datetime, str]) -> str:
    """
    Format date to ISO format string
    
    Args:
        d: Date object or string
        
    Returns:
        ISO formatted date string
    """
    if isinstance(d, str):
        return d
    elif isinstance(d, datetime):
        return d.date().isoformat()
    elif isinstance(d, date):
        return d.isoformat()
    return str(d)


def format_datetime(dt: Union[datetime, str]) -> str:
    """
    Format datetime to ISO format string
    
    Args:
        dt: Datetime object or string
        
    Returns:
        ISO formatted datetime string
    """
    if isinstance(dt, str):
        return dt
    elif isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


def parse_date(date_str: str) -> Optional[date]:
    """
    Parse date string to date object
    
    Args:
        date_str: Date string in various formats
        
    Returns:
        Date object or None if parsing fails
    """
    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%d %b %Y",
        "%d %B %Y",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    
    return None


def parse_datetime(dt_str: str) -> Optional[datetime]:
    """
    Parse datetime string to datetime object
    
    Args:
        dt_str: Datetime string
        
    Returns:
        Datetime object or None if parsing fails
    """
    try:
        return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
    except ValueError:
        pass
    
    formats = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%d-%m-%Y %H:%M:%S",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(dt_str.strip(), fmt)
        except ValueError:
            continue
    
    return None


def calculate_end_date(start_date: date, duration_days: int) -> date:
    """
    Calculate end date from start date and duration
    
    Args:
        start_date: Starting date
        duration_days: Number of days
        
    Returns:
        End date
    """
    return start_date + timedelta(days=duration_days)


def get_time_until(target_time: datetime) -> Dict[str, int]:
    """
    Get time remaining until a target time
    
    Args:
        target_time: Target datetime
        
    Returns:
        Dictionary with hours, minutes, seconds remaining
    """
    now = datetime.utcnow()
    diff = target_time - now
    
    if diff.total_seconds() < 0:
        return {"hours": 0, "minutes": 0, "seconds": 0, "is_past": True}
    
    hours, remainder = divmod(int(diff.total_seconds()), 3600)
    minutes, seconds = divmod(remainder, 60)
    
    return {
        "hours": hours,
        "minutes": minutes,
        "seconds": seconds,
        "is_past": False
    }


def timing_to_hour(timing: str) -> int:
    """
    Convert timing string to hour of day
    
    Args:
        timing: Timing string (morning, afternoon, evening, night)
        
    Returns:
        Hour of day (0-23)
    """
    timing_map = {
        "morning": 8,
        "before_breakfast": 7,
        "after_breakfast": 9,
        "afternoon": 13,
        "before_lunch": 12,
        "after_lunch": 14,
        "evening": 18,
        "before_dinner": 19,
        "after_dinner": 21,
        "night": 21,
        "bedtime": 22,
    }
    
    return timing_map.get(timing.lower(), 8)


def parse_frequency(frequency: str) -> Dict[str, Any]:
    """
    Parse frequency string to structured data
    
    Args:
        frequency: Frequency string (e.g., "twice daily", "every 8 hours")
        
    Returns:
        Structured frequency data
    """
    frequency_lower = frequency.lower()
    
    # Check for "X times daily" pattern
    times_match = re.search(r'(\d+)\s*times?\s*(daily|a day|per day)', frequency_lower)
    if times_match:
        return {
            "times_per_day": int(times_match.group(1)),
            "interval_hours": 24 // int(times_match.group(1))
        }
    
    # Check for common patterns
    patterns = {
        "once daily": {"times_per_day": 1, "interval_hours": 24},
        "twice daily": {"times_per_day": 2, "interval_hours": 12},
        "thrice daily": {"times_per_day": 3, "interval_hours": 8},
        "three times": {"times_per_day": 3, "interval_hours": 8},
        "four times": {"times_per_day": 4, "interval_hours": 6},
        "every 4 hours": {"times_per_day": 6, "interval_hours": 4},
        "every 6 hours": {"times_per_day": 4, "interval_hours": 6},
        "every 8 hours": {"times_per_day": 3, "interval_hours": 8},
        "every 12 hours": {"times_per_day": 2, "interval_hours": 12},
    }
    
    for pattern, data in patterns.items():
        if pattern in frequency_lower:
            return data
    
    return {"times_per_day": 1, "interval_hours": 24}


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename for safe storage
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove any path components
    filename = filename.replace('\\', '/').split('/')[-1]
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[^\w\-_\.]', '_', filename)
    
    # Limit length
    if len(sanitized) > 255:
        name, ext = sanitized.rsplit('.', 1) if '.' in sanitized else (sanitized, '')
        sanitized = name[:250] + ('.' + ext if ext else '')
    
    return sanitized


def hash_file_content(content: bytes) -> str:
    """
    Generate SHA256 hash of file content
    
    Args:
        content: File content as bytes
        
    Returns:
        Hex digest of hash
    """
    return hashlib.sha256(content).hexdigest()


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to specified length
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated
        
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def format_phone_number(phone: str, country_code: str = "+91") -> str:
    """
    Format phone number to E.164 format
    
    Args:
        phone: Phone number
        country_code: Default country code
        
    Returns:
        Formatted phone number
    """
    # Remove non-digits except +
    cleaned = ''.join(c for c in phone if c.isdigit() or c == '+')
    
    if cleaned.startswith('+'):
        return cleaned
    
    if len(cleaned) == 10:
        return country_code + cleaned
    
    return '+' + cleaned


def calculate_adherence_percentage(taken: int, total: int) -> float:
    """
    Calculate adherence percentage
    
    Args:
        taken: Number of doses taken
        total: Total scheduled doses
        
    Returns:
        Percentage (0-100)
    """
    if total == 0:
        return 100.0
    return round((taken / total) * 100, 1)


def get_risk_level(value: float, min_normal: float, max_normal: float) -> str:
    """
    Determine risk level based on value and normal range
    
    Args:
        value: The measured value
        min_normal: Minimum normal value
        max_normal: Maximum normal value
        
    Returns:
        Risk level: "normal", "warning", or "critical"
    """
    if min_normal <= value <= max_normal:
        return "normal"
    
    # Calculate how far outside the range
    if value < min_normal:
        deviation = (min_normal - value) / min_normal
    else:
        deviation = (value - max_normal) / max_normal
    
    if deviation > 0.3:  # More than 30% outside range
        return "critical"
    
    return "warning"


def merge_dicts(base: Dict, update: Dict) -> Dict:
    """
    Deep merge two dictionaries
    
    Args:
        base: Base dictionary
        update: Dictionary with updates
        
    Returns:
        Merged dictionary
    """
    result = base.copy()
    
    for key, value in update.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dicts(result[key], value)
        else:
            result[key] = value
    
    return result


def paginate_list(items: List, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
    """
    Paginate a list of items
    
    Args:
        items: List of items
        page: Page number (1-indexed)
        per_page: Items per page
        
    Returns:
        Paginated result with metadata
    """
    total = len(items)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    return {
        "items": items[start_idx:end_idx],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "has_next": end_idx < total,
        "has_prev": page > 1
    }
