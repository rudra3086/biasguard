import pandas as pd
import numpy as np
from typing import Tuple, List, Dict


def handle_missing_values(df: pd.DataFrame, strategy: str = 'drop') -> pd.DataFrame:
    """
    Handle missing values in the dataset.
    
    Args:
        df: DataFrame to process
        strategy: 'drop' to remove rows with NaN, 'fill' to fill with mode/mean
        
    Returns:
        Processed DataFrame
    """
    df = df.copy()
    
    if strategy == 'drop':
        df = df.dropna()
    elif strategy == 'fill':
        for col in df.columns:
            if df[col].isnull().sum() > 0:
                if df[col].dtype == 'object':
                    df[col].fillna(df[col].mode()[0] if df[col].mode().size > 0 else 'Unknown', inplace=True)
                else:
                    df[col].fillna(df[col].mean(), inplace=True)
    
    return df


def prepare_features(df: pd.DataFrame, categorical_cols: List[str], 
                     numerical_cols: List[str]) -> Tuple[pd.DataFrame, Dict]:
    """
    Prepare and transform features for bias analysis.
    
    Args:
        df: Input DataFrame
        categorical_cols: List of categorical column names
        numerical_cols: List of numerical column names
        
    Returns:
        Tuple of (processed DataFrame, transformation info)
    """
    df_processed = df.copy()
    transform_info = {
        'categorical_transforms': {},
        'numerical_transforms': {}
    }
    
    # Convert categorical columns to string
    for col in categorical_cols:
        df_processed[col] = df_processed[col].astype(str)
    
    # Bin numerical columns into quartiles
    for col in numerical_cols:
        if col in df_processed.columns and df_processed[col].notna().sum() > 0:
            try:
                df_processed[f'{col}_binned'] = pd.qcut(
                    df_processed[col],
                    q=4,
                    labels=['Q1', 'Q2', 'Q3', 'Q4'],
                    duplicates='drop'
                )
                transform_info['numerical_transforms'][col] = f'{col}_binned'
            except Exception:
                pass
    
    return df_processed, transform_info


def validate_target_column(df: pd.DataFrame, target_column: str) -> bool:
    """
    Validate that target column exists and is appropriate.
    
    Args:
        df: DataFrame to validate
        target_column: Name of target column
        
    Returns:
        True if valid, raises exception otherwise
    """
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in dataset")
    return True


def validate_dataset(df: pd.DataFrame, min_rows: int = 10) -> Tuple[bool, str]:
    """
    Validate dataset quality.
    
    Args:
        df: DataFrame to validate
        min_rows: Minimum number of rows required
        
    Returns:
        Tuple of (is_valid, message)
    """
    if df.shape[0] < min_rows:
        return False, f"Dataset has {df.shape[0]} rows, minimum {min_rows} required"
    
    if df.shape[1] < 2:
        return False, "Dataset must have at least 2 columns"
    
    if df.empty:
        return False, "Dataset is empty"
    
    return True, "Dataset is valid"


def encode_target(df: pd.DataFrame, target_col: str, task_type: str = 'classification') -> Tuple[pd.DataFrame, Dict]:
    """
    Encode target column for analysis.
    
    Args:
        df: Input DataFrame
        target_col: Target column name
        task_type: 'classification' or 'regression'
        
    Returns:
        Tuple of (processed DataFrame, encoding mapping)
    """
    df_processed = df.copy()
    encoding_map = {}
    
    if task_type == 'classification':
        if df_processed[target_col].dtype == 'object':
            unique_vals = df_processed[target_col].unique()
            encoding_map = {val: idx for idx, val in enumerate(unique_vals)}
            df_processed[target_col] = df_processed[target_col].map(encoding_map)
        
        # Convert to binary (0/1) if possible
        unique_vals = df_processed[target_col].unique()
        if len(unique_vals) == 2:
            min_val = min(unique_vals)
            df_processed[target_col] = (df_processed[target_col] != min_val).astype(int)
    
    return df_processed, encoding_map
