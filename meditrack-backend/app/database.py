"""
Supabase Database Connection and Operations
"""
from supabase import create_client, Client
from typing import Optional, Dict, Any, List
from app.config import settings


class Database:
    """Supabase database wrapper"""
    
    _instance: Optional[Client] = None
    _mock_mode: bool = False
    
    @classmethod
    def get_client(cls) -> Optional[Client]:
        """Get or create Supabase client singleton"""
        if cls._instance is None:
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY or \
               settings.SUPABASE_URL == "your-supabase-url" or \
               settings.SUPABASE_KEY == "your-supabase-anon-key":
                cls._mock_mode = True
                print("[WARNING] Supabase not configured - running in mock mode")
                return None
            try:
                cls._instance = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_KEY
                )
            except Exception as e:
                print(f"[WARNING] Supabase connection failed: {e} - running in mock mode")
                cls._mock_mode = True
                return None
        return cls._instance
    
    @classmethod
    def get_supabase(cls) -> Optional[Client]:
        """Alias for get_client"""
        return cls.get_client()
    
    @classmethod
    def is_mock_mode(cls) -> bool:
        """Check if running in mock mode"""
        return cls._mock_mode


# Database helper functions
def get_db() -> Optional[Client]:
    """Dependency injection for database client"""
    return Database.get_client()


# In-memory mock storage for development
_mock_storage: Dict[str, List[Dict[str, Any]]] = {
    "users": [],
    "prescriptions": [],
    "medicines": [],
    "medicine_logs": [],
    "health_reports": []
}


class DatabaseOperations:
    """Common database operations"""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.client = Database.get_client()
    
    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new record"""
        if Database.is_mock_mode():
            _mock_storage[self.table_name].append(data)
            return data
        response = self.client.table(self.table_name).insert(data).execute()
        return response.data[0] if response.data else None
    
    async def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        """Get record by ID"""
        if Database.is_mock_mode():
            for item in _mock_storage[self.table_name]:
                if item.get("id") == id:
                    return item
            return None
        response = self.client.table(self.table_name).select("*").eq("id", id).execute()
        return response.data[0] if response.data else None
    
    async def get_all(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Get all records with optional filters"""
        if Database.is_mock_mode():
            items = _mock_storage[self.table_name]
            if filters:
                items = [item for item in items if all(item.get(k) == v for k, v in filters.items())]
            return items
        query = self.client.table(self.table_name).select("*")
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        response = query.execute()
        return response.data
    
    async def update(self, id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a record"""
        if Database.is_mock_mode():
            for item in _mock_storage[self.table_name]:
                if item.get("id") == id:
                    item.update(data)
                    return item
            return None
        response = self.client.table(self.table_name).update(data).eq("id", id).execute()
        return response.data[0] if response.data else None
    
    async def delete(self, id: str) -> bool:
        """Delete a record"""
        if Database.is_mock_mode():
            for i, item in enumerate(_mock_storage[self.table_name]):
                if item.get("id") == id:
                    _mock_storage[self.table_name].pop(i)
                    return True
            return False
        response = self.client.table(self.table_name).delete().eq("id", id).execute()
        return len(response.data) > 0
    
    async def get_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all records for a specific user"""
        if Database.is_mock_mode():
            return [item for item in _mock_storage[self.table_name] if item.get("user_id") == user_id]
        response = self.client.table(self.table_name).select("*").eq("user_id", user_id).execute()
        return response.data


# Table-specific operations
class UserDB(DatabaseOperations):
    def __init__(self):
        super().__init__("users")
    
    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        if Database.is_mock_mode():
            for item in _mock_storage["users"]:
                if item.get("email") == email:
                    return item
            return None
        response = self.client.table(self.table_name).select("*").eq("email", email).execute()
        return response.data[0] if response.data else None


class PrescriptionDB(DatabaseOperations):
    def __init__(self):
        super().__init__("prescriptions")


class MedicineDB(DatabaseOperations):
    def __init__(self):
        super().__init__("medicines")
    
    async def get_by_prescription_id(self, prescription_id: str) -> List[Dict[str, Any]]:
        """Get all medicines for a prescription"""
        if Database.is_mock_mode():
            return [item for item in _mock_storage["medicines"] if item.get("prescription_id") == prescription_id]
        response = self.client.table(self.table_name).select("*").eq("prescription_id", prescription_id).execute()
        return response.data


class MedicineLogDB(DatabaseOperations):
    def __init__(self):
        super().__init__("medicine_logs")
    
    async def get_by_medicine_id(self, medicine_id: str) -> List[Dict[str, Any]]:
        """Get all logs for a medicine"""
        if Database.is_mock_mode():
            return [item for item in _mock_storage["medicine_logs"] if item.get("medicine_id") == medicine_id]
        response = self.client.table(self.table_name).select("*").eq("medicine_id", medicine_id).execute()
        return response.data


class HealthReportDB(DatabaseOperations):
    def __init__(self):
        super().__init__("health_reports")


# Initialize database instances
user_db = UserDB()
prescription_db = PrescriptionDB()
medicine_db = MedicineDB()
medicine_log_db = MedicineLogDB()
health_report_db = HealthReportDB()
