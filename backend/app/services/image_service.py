import os
import io
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.image import SatelliteImage
from app.core.config import settings
import uuid
from typing import Optional
from datetime import datetime

s3_client = None
if settings.STORAGE_MODE.lower() == "minio":
    import boto3

    s3_client = boto3.client(
        's3',
        endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    )

def ensure_bucket_exists():
    if s3_client is None:
        os.makedirs(settings.STORAGE_PATH, exist_ok=True)
        return
    try:
        s3_client.head_bucket(Bucket=settings.MINIO_BUCKET_NAME)
    except:
        s3_client.create_bucket(Bucket=settings.MINIO_BUCKET_NAME)

def process_and_save_image(
    db: Session,
    project_id: int,
    file: UploadFile,
    sensor_name: Optional[str] = None,
    acquisition_date: Optional[str] = None
) -> SatelliteImage:
    ensure_bucket_exists()
    
    file_content = file.file.read()
    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{project_id}/{uuid.uuid4()}{file_ext}"
    
    # Store locally by default; use MinIO when STORAGE_MODE=minio.
    try:
        if s3_client is None:
            local_path = os.path.join(settings.STORAGE_PATH, unique_filename)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            with open(local_path, "wb") as stored_file:
                stored_file.write(file_content)
        else:
            s3_client.put_object(
                Bucket=settings.MINIO_BUCKET_NAME,
                Key=unique_filename,
                Body=file_content
            )
    except Exception as e:
        print(f"Image storage warning: {e}")
    
    # Basic metadata extraction (using rasterio MemoryFile)
    crs = None
    width = None
    height = None
    band_count = None
    pixel_resolution = None
    modality = "UNKNOWN"
    bounds_str = None
    
    if file_ext in ['.tif', '.tiff']:
        try:
            import rasterio

            with rasterio.MemoryFile(file_content) as memfile:
                with memfile.open() as src:
                    crs = src.crs.to_string() if src.crs else None
                    width = src.width
                    height = src.height
                    band_count = src.count
                    bounds_str = str(src.bounds)
                    
                    # Extract pixel resolution from transform
                    if src.transform:
                        pixel_resolution = abs(src.transform.a)
                    
                    # Modality detection from band count
                    if band_count == 3 or band_count == 4:
                        modality = "OPTICAL"
                    elif band_count > 4:
                        modality = "MULTISPECTRAL"
                    elif band_count == 1:
                        modality = "SAR"
        except Exception as e:
            print(f"Error parsing TIFF: {e}")
            pass
    elif file_ext in ['.png', '.jpg', '.jpeg']:
        modality = "OPTICAL"
    
    # Parse acquisition date if provided
    acq_date = None
    if acquisition_date:
        try:
            acq_date = datetime.strptime(acquisition_date, "%Y-%m-%d")
        except:
            pass
    
    db_image = SatelliteImage(
        project_id=project_id,
        filename=file.filename,
        file_type=file_ext,
        storage_path=unique_filename,
        modality=modality,
        sensor_name=sensor_name,
        acquisition_date=acq_date,
        crs=crs,
        width=width,
        height=height,
        band_count=band_count,
        pixel_resolution=pixel_resolution,
        bounds=bounds_str,
        validation_status="VALID",
        cloud_cover=5.0  # Mock cloud cover, would need actual ML in production
    )
    
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image
