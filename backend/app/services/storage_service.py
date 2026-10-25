import os
import shutil
import uuid
import hashlib
from abc import ABC, abstractmethod
from typing import Tuple, Optional, BinaryIO
from pathlib import Path

from app.core.config import settings
from app.core.logging import logger


class StorageService(ABC):
    @abstractmethod
    async def save_file(self, file_content: bytes, original_filename: str) -> Tuple[str, str, int, str]:
        """
        Save file to storage.
        Returns: (storage_key, sha256_hash, file_size_bytes, formatted_size)
        """
        pass

    @abstractmethod
    async def get_file_bytes(self, storage_key: str) -> bytes:
        """Retrieve file bytes from storage."""
        pass

    async def get_file(self, storage_key: str) -> bytes:
        """Alias for get_file_bytes."""
        return await self.get_file_bytes(storage_key)

    @abstractmethod
    async def delete_file(self, storage_key: str) -> bool:
        """Delete file from storage."""
        pass


class LocalDiskStorageService(StorageService):
    def __init__(self, base_dir: str = settings.STORAGE_LOCAL_DIR):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _format_size(self, size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

    async def save_file(self, file_content: bytes, original_filename: str) -> Tuple[str, str, int, str]:
        file_size = len(file_content)
        sha256_hash = hashlib.sha256(file_content).hexdigest()
        
        # Unique safe storage key
        safe_ext = Path(original_filename).suffix
        unique_name = f"{uuid.uuid4().hex}{safe_ext}"
        storage_key = f"evidence/{unique_name}"
        
        dest_path = self.base_dir / "evidence" / unique_name
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(dest_path, "wb") as f:
            f.write(file_content)
            
        formatted_size = self._format_size(file_size)
        logger.info(f"File stored locally: {storage_key} ({formatted_size}, SHA256: {sha256_hash[:12]}...)")
        return storage_key, sha256_hash, file_size, formatted_size

    async def get_file_bytes(self, storage_key: str) -> bytes:
        file_path = self.base_dir / storage_key
        if not file_path.exists():
            raise FileNotFoundError(f"Storage key {storage_key} not found")
        with open(file_path, "rb") as f:
            return f.read()

    async def delete_file(self, storage_key: str) -> bool:
        file_path = self.base_dir / storage_key
        if file_path.exists():
            file_path.unlink()
            return True
        return False


class MinIOStorageService(StorageService):
    def __init__(self):
        try:
            from minio import Minio
            self.client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE
            )
            # Ensure bucket exists
            if not self.client.bucket_exists(settings.MINIO_BUCKET):
                self.client.make_bucket(settings.MINIO_BUCKET)
        except Exception as e:
            logger.warning(f"MinIO initialization failed ({e}), falling back to LocalDiskStorageService")
            self.client = None

    def _format_size(self, size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.1f} MB"

    async def save_file(self, file_content: bytes, original_filename: str) -> Tuple[str, str, int, str]:
        import io
        if not self.client:
            fallback = LocalDiskStorageService()
            return await fallback.save_file(file_content, original_filename)

        file_size = len(file_content)
        sha256_hash = hashlib.sha256(file_content).hexdigest()
        safe_ext = Path(original_filename).suffix
        storage_key = f"evidence/{uuid.uuid4().hex}{safe_ext}"

        self.client.put_object(
            bucket_name=settings.MINIO_BUCKET,
            object_name=storage_key,
            data=io.BytesIO(file_content),
            length=file_size
        )
        return storage_key, sha256_hash, file_size, self._format_size(file_size)

    async def get_file_bytes(self, storage_key: str) -> bytes:
        if not self.client:
            fallback = LocalDiskStorageService()
            return await fallback.get_file_bytes(storage_key)

        response = self.client.get_object(settings.MINIO_BUCKET, storage_key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    async def delete_file(self, storage_key: str) -> bool:
        if not self.client:
            fallback = LocalDiskStorageService()
            return await fallback.delete_file(storage_key)
        self.client.remove_object(settings.MINIO_BUCKET, storage_key)
        return True


def get_storage_service() -> StorageService:
    if settings.STORAGE_BACKEND == "minio":
        return MinIOStorageService()
    return LocalDiskStorageService()


storage_service = get_storage_service()
