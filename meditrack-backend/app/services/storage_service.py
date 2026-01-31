"""
Storage Service - File upload to Firebase Storage, AWS S3, or local storage
"""
import os
import uuid
import aiofiles
from typing import Optional
from datetime import datetime

from app.config import settings


class StorageService:
    """
    Storage Service for uploading files to Firebase Storage, AWS S3, or local storage
    """
    
    def __init__(self):
        """Initialize storage service based on configuration"""
        self.provider = settings.STORAGE_PROVIDER
        self.s3_client = None
        self.firebase_bucket = None
        
        if self.provider == "s3" and settings.AWS_ACCESS_KEY_ID:
            self._init_s3()
        elif self.provider == "firebase" and settings.FIREBASE_CREDENTIALS_PATH:
            self._init_firebase()
        else:
            self._init_local()
    
    def _init_s3(self):
        """Initialize AWS S3 client"""
        try:
            import boto3
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
        except Exception as e:
            print(f"Failed to initialize S3: {e}")
            self.provider = "local"
            self._init_local()
    
    def _init_firebase(self):
        """Initialize Firebase Storage"""
        try:
            import firebase_admin
            from firebase_admin import credentials, storage
            
            if not firebase_admin._apps:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': f"{settings.APP_NAME.lower().replace(' ', '-')}.appspot.com"
                })
            
            self.firebase_bucket = storage.bucket()
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")
            self.provider = "local"
            self._init_local()
    
    def _init_local(self):
        """Initialize local storage"""
        self.local_path = settings.LOCAL_STORAGE_PATH
        os.makedirs(self.local_path, exist_ok=True)
    
    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        content_type: str,
        folder: str = "uploads"
    ) -> str:
        """
        Upload a file to the configured storage provider
        
        Args:
            file_content: Raw bytes of the file
            filename: Original filename
            content_type: MIME type of the file
            folder: Folder/prefix for organizing files
            
        Returns:
            URL of the uploaded file
        """
        # Generate unique filename
        ext = os.path.splitext(filename)[1]
        unique_filename = f"{folder}/{datetime.utcnow().strftime('%Y/%m/%d')}/{uuid.uuid4()}{ext}"
        
        if self.provider == "s3":
            return await self._upload_to_s3(file_content, unique_filename, content_type)
        elif self.provider == "firebase":
            return await self._upload_to_firebase(file_content, unique_filename, content_type)
        else:
            return await self._upload_to_local(file_content, unique_filename)
    
    async def _upload_to_s3(self, file_content: bytes, filename: str, content_type: str) -> str:
        """Upload to AWS S3"""
        try:
            self.s3_client.put_object(
                Bucket=settings.AWS_BUCKET_NAME,
                Key=filename,
                Body=file_content,
                ContentType=content_type
            )
            
            return f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
        except Exception as e:
            print(f"S3 upload error: {e}")
            # Fallback to local
            return await self._upload_to_local(file_content, filename)
    
    async def _upload_to_firebase(self, file_content: bytes, filename: str, content_type: str) -> str:
        """Upload to Firebase Storage"""
        try:
            blob = self.firebase_bucket.blob(filename)
            blob.upload_from_string(file_content, content_type=content_type)
            blob.make_public()
            return blob.public_url
        except Exception as e:
            print(f"Firebase upload error: {e}")
            # Fallback to local
            return await self._upload_to_local(file_content, filename)
    
    async def _upload_to_local(self, file_content: bytes, filename: str) -> str:
        """Upload to local storage"""
        try:
            file_path = os.path.join(self.local_path, filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_content)
            
            # Return a local URL (in production, this should be served properly)
            return f"/uploads/{filename}"
        except Exception as e:
            raise Exception(f"Failed to save file locally: {e}")
    
    async def download_file(self, file_url: str) -> bytes:
        """
        Download a file from storage
        
        Args:
            file_url: URL of the file to download
            
        Returns:
            File content as bytes
        """
        if file_url.startswith('/uploads/'):
            # Local file
            return await self._download_from_local(file_url)
        elif 's3.amazonaws.com' in file_url:
            return await self._download_from_s3(file_url)
        elif 'storage.googleapis.com' in file_url or 'firebasestorage' in file_url:
            return await self._download_from_firebase(file_url)
        else:
            # Try to download from URL
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(file_url)
                response.raise_for_status()
                return response.content
    
    async def _download_from_local(self, file_url: str) -> bytes:
        """Download from local storage"""
        file_path = file_url.replace('/uploads/', '')
        full_path = os.path.join(self.local_path, file_path)
        
        async with aiofiles.open(full_path, 'rb') as f:
            return await f.read()
    
    async def _download_from_s3(self, file_url: str) -> bytes:
        """Download from S3"""
        # Extract key from URL
        key = file_url.split('.amazonaws.com/')[-1]
        
        response = self.s3_client.get_object(
            Bucket=settings.AWS_BUCKET_NAME,
            Key=key
        )
        return response['Body'].read()
    
    async def _download_from_firebase(self, file_url: str) -> bytes:
        """Download from Firebase Storage"""
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(file_url)
            response.raise_for_status()
            return response.content
    
    async def delete_file(self, file_url: str) -> bool:
        """
        Delete a file from storage
        
        Args:
            file_url: URL of the file to delete
            
        Returns:
            True if successful
        """
        try:
            if file_url.startswith('/uploads/'):
                # Local file
                file_path = file_url.replace('/uploads/', '')
                full_path = os.path.join(self.local_path, file_path)
                if os.path.exists(full_path):
                    os.remove(full_path)
                return True
            
            elif 's3.amazonaws.com' in file_url:
                key = file_url.split('.amazonaws.com/')[-1]
                self.s3_client.delete_object(
                    Bucket=settings.AWS_BUCKET_NAME,
                    Key=key
                )
                return True
            
            elif 'storage.googleapis.com' in file_url or 'firebasestorage' in file_url:
                # Extract blob name and delete
                blob_name = file_url.split('/o/')[-1].split('?')[0]
                blob = self.firebase_bucket.blob(blob_name)
                blob.delete()
                return True
            
            return False
            
        except Exception as e:
            print(f"Delete error: {e}")
            return False
    
    def get_file_url(self, filename: str) -> str:
        """
        Get the public URL for a file
        
        Args:
            filename: The filename/key of the file
            
        Returns:
            Public URL
        """
        if self.provider == "s3":
            return f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
        elif self.provider == "firebase":
            blob = self.firebase_bucket.blob(filename)
            return blob.public_url
        else:
            return f"/uploads/{filename}"


# Singleton instance
storage_service = StorageService()
