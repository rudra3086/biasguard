import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Set


def detect_categorical_columns(df: pd.DataFrame, threshold: int = 10) -> List[str]:
    """
    Detect categorical columns based on unique value count.
    
    Args:
        df: DataFrame to analyze
        threshold: Max unique values to consider as categorical
        
    Returns:
        List of categorical column names
    """
    categorical_cols = []
    for col in df.columns:
        if df[col].dtype == 'object' or df[col].nunique() <= threshold:
            categorical_cols.append(col)
    return categorical_cols


def detect_numerical_columns(df: pd.DataFrame, threshold: int = 10) -> List[str]:
    """
    Detect numerical columns.
    
    Args:
        df: DataFrame to analyze
        threshold: Max unique values to still consider as numerical
        
    Returns:
        List of numerical column names
    """
    numerical_cols = []
    for col in df.columns:
        if df[col].dtype in ['int64', 'float64', 'int32', 'float32']:
            if df[col].nunique() > threshold:
                numerical_cols.append(col)
    return numerical_cols


def detect_sensitive_features(df: pd.DataFrame, provided_features: List[str] = None) -> List[str]:
    """
    Automatically detect potential sensitive attributes using heuristics.
    
    Args:
        df: DataFrame to analyze
        provided_features: User-provided sensitive feature list
        
    Returns:
        List of detected sensitive features
    """
    if provided_features:
        return [f for f in provided_features if f in df.columns]
    
    sensitive_keywords = [
        'gender', 'sex', 'age', 'race', 'ethnicity', 'religion',
        'area', 'location', 'region', 'country', 'state', 'city',
        'income', 'salary', 'education', 'caste', 'marital', 'disability'
    ]
    
    detected = []
    for col in df.columns:
        col_lower = col.lower()
        if any(keyword in col_lower for keyword in sensitive_keywords):
            detected.append(col)
    
    return detected


def get_data_types(df: pd.DataFrame) -> Dict[str, str]:
    """
    Get detected data types for all columns.
    
    Args:
        df: DataFrame to analyze
        
    Returns:
        Dictionary mapping column names to detected types
    """
    types = {}
    categorical_cols = set(detect_categorical_columns(df))
    
    for col in df.columns:
        if col in categorical_cols:
            types[col] = 'categorical'
        else:
            types[col] = 'numerical'
    
    return types


def get_column_info(df: pd.DataFrame) -> Dict:
    """
    Get comprehensive column information.
    
    Args:
        df: DataFrame to analyze
        
    Returns:
        Dictionary with column metadata
    """
    info = {
        'column_names': list(df.columns),
        'data_types': get_data_types(df),
        'missing_values': df.isnull().sum().to_dict(),
        'unique_counts': df.nunique().to_dict(),
        'shape': df.shape
    }
    return info
