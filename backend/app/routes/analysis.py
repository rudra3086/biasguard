from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel
import pandas as pd
import os
import logging
from datetime import datetime

from ..services.bias_analysis import BiasAnalysisService

logger = logging.getLogger(__name__)


class AnalyzeRequest(BaseModel):
    """Request model for bias analysis endpoint."""
    file_id: str
    target_column: str
    task_type: str = 'classification'
    sensitive_features: Optional[List[str]] = None

router = APIRouter(prefix="/api", tags=["upload"])

# Store uploaded files temporarily
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

bias_service = BiasAnalysisService()


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload and parse CSV dataset.
    
    Returns:
        - column_names: List of column names
        - data_types: Detected data types
        - unique_counts: Unique value counts per column
        - shape: Dataset shape (rows, columns)
        - file_id: Unique identifier for uploaded file
    """
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files are supported"
            )
        
        # Read file content
        content = await file.read()
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )
        
        # Parse CSV
        try:
            df, message = bias_service.parse_csv(content)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid CSV format: {str(e)}"
            )
        
        # Get dataset info
        dataset_info = bias_service.get_dataset_info(df)
        
        # Generate file ID
        file_id = f"{datetime.now().timestamp()}_{file.filename}"
        
        # Save file temporarily
        filepath = os.path.join(UPLOAD_DIR, file_id)
        df.to_csv(filepath, index=False)
        
        return {
            'status': 'success',
            'message': 'File uploaded successfully',
            'file_id': file_id,
            'filename': file.filename,
            **dataset_info
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )


@router.post("/analyze")
async def analyze_bias(request: AnalyzeRequest):
    """
    Analyze dataset for bias.
    
    Parameters:
        - file_id: ID from upload endpoint
        - target_column: Name of target column for prediction
        - task_type: 'classification' or 'regression'
        - sensitive_features: Optional list of sensitive features (auto-detected if not provided)
    
    Returns:
        - summary: Overall fairness metrics
        - features: Detailed bias analysis per feature
        - explanations: Human-readable bias explanations
        - trends: Bias trends and recommendations
        - explainability: Top contributing features
    """
    try:
        # Load file
        filepath = os.path.join(UPLOAD_DIR, request.file_id)
        
        if not os.path.exists(filepath):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found: {request.file_id}"
            )
        
        # Read dataset
        try:
            df = pd.read_csv(filepath)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading file: {str(e)}"
            )
        
        # Validate parameters
        if request.target_column not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Target column '{request.target_column}' not found in dataset"
            )
        
        if request.task_type not in ['classification', 'regression']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="task_type must be 'classification' or 'regression'"
            )
        
        # Run analysis
        result = bias_service.analyze_bias(
            df,
            request.target_column,
            request.task_type,
            request.sensitive_features
        )
        
        if result.get('status') == 'error':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get('message', 'Analysis failed')
            )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing dataset: {str(e)}"
        )
