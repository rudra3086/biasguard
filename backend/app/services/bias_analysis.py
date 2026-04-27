import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import io

from ..utils.feature_detection import (
    detect_categorical_columns,
    detect_numerical_columns,
    detect_sensitive_features,
    get_column_info
)
from ..utils.preprocessing import (
    handle_missing_values,
    prepare_features,
    validate_target_column,
    validate_dataset,
    encode_target
)
from ..utils.bias_metrics import (
    analyze_feature,
    compute_fairness_score,
    get_most_biased_feature,
    filter_features_by_severity
)
from ..utils.explainability import (
    compute_shap_style_importance,
    generate_explanations,
    get_bias_trends,
    get_feature_importance
)
from .demographic_detector import DemographicDetector


class BiasAnalysisService:
    """Service for comprehensive bias analysis on datasets."""
    
    def __init__(self):
        self.df = None
        self.target_col = None
        self.task_type = None
        self.sensitive_features = []
        self.demographic_detector = DemographicDetector()
        self.detected_demographics = []
    
    def parse_csv(self, file_content: bytes) -> Tuple[pd.DataFrame, str]:
        """
        Parse CSV file from bytes.
        
        Args:
            file_content: CSV file content as bytes
            
        Returns:
            Tuple of (DataFrame, status message)
            
        Raises:
            ValueError: If CSV parsing fails
        """
        try:
            df = pd.read_csv(io.BytesIO(file_content))
            return df, "CSV parsed successfully"
        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {str(e)}")
    
    def get_dataset_info(self, df: pd.DataFrame) -> Dict:
        """
        Get information about uploaded dataset.
        
        Args:
            df: Uploaded DataFrame
            
        Returns:
            Dictionary with dataset information
        """
        # Validate dataset
        is_valid, message = validate_dataset(df)
        if not is_valid:
            raise ValueError(message)
        
        column_info = get_column_info(df)
        
        return {
            'status': 'success',
            'dataset_shape': {'rows': df.shape[0], 'columns': df.shape[1]},
            'column_info': column_info,
            'message': 'Dataset uploaded successfully'
        }
    
    def analyze_bias(self, df: pd.DataFrame, target_column: str, 
                    task_type: str = 'classification',
                    sensitive_features: List[str] = None) -> Dict:
        """
        Perform comprehensive bias analysis on dataset.
        
        Args:
            df: Input DataFrame
            target_column: Target column name
            task_type: 'classification' or 'regression'
            sensitive_features: List of sensitive feature columns (auto-detected if None)
            
        Returns:
            Dictionary with complete bias analysis results
        """
        try:
            # Validate inputs
            validate_target_column(df, target_column)
            is_valid, message = validate_dataset(df)
            if not is_valid:
                raise ValueError(message)
            
            # Store configuration
            self.df = df.copy()
            self.target_col = target_column
            self.task_type = task_type
            
            # Preprocess data
            df_processed = handle_missing_values(self.df, strategy='fill')
            
            # Detect features
            categorical_cols = detect_categorical_columns(df_processed)
            numerical_cols = detect_numerical_columns(df_processed)
            
            # Use Gemini to detect demographic categories
            all_columns = list(df_processed.columns)
            
            # Prepare sample data for context
            sample_data = {}
            for col in all_columns[:20]:  # Limit to first 20 columns
                if col in df_processed.columns:
                    sample_data[col] = df_processed[col].dropna().unique()[:5].tolist()
            
            # Detect demographics using Gemini
            demo_detection = self.demographic_detector.detect_demographic_categories(
                all_columns,
                sample_data
            )
            
            # Extract detected demographic column names
            self.detected_demographics = [d['column'] for d in demo_detection.get('demographic_categories', [])]
            
            # Detect sensitive features
            self.sensitive_features = detect_sensitive_features(
                df_processed,
                provided_features=sensitive_features
            )
            
            # Remove target and index columns
            analysis_features = [
                col for col in (categorical_cols + numerical_cols)
                if col != target_column and col != 'Unnamed: 0'
            ]
            
            # Encode target
            df_encoded, encoding_map = encode_target(df_processed, target_column, task_type)
            
            # Prepare features
            df_prepped, transform_info = prepare_features(
                df_encoded,
                [col for col in categorical_cols if col in analysis_features],
                [col for col in numerical_cols if col in analysis_features]
            )
            
            # Analyze features
            feature_analysis = []
            feature_bias_scores = {}
            
            # Analyze categorical features
            for feature in categorical_cols:
                if feature in analysis_features:
                    analysis = analyze_feature(df_prepped, feature, target_column, task_type)
                    if analysis:
                        feature_analysis.append(analysis)
                        feature_bias_scores[feature] = analysis['bias_score']
            
            # Analyze binned numerical features
            binned_features = [col for col in df_prepped.columns if col.endswith('_binned')]
            for binned_col in binned_features:
                analysis = analyze_feature(df_prepped, binned_col, target_column, task_type)
                if analysis:
                    original_name = binned_col.replace('_binned', '')
                    analysis['feature'] = original_name
                    feature_analysis.append(analysis)
                    if original_name not in feature_bias_scores:
                        feature_bias_scores[original_name] = analysis['bias_score']
            
            # Sort features by bias score
            feature_analysis.sort(key=lambda x: x.get('bias_score', 0), reverse=True)
            
            # Compute overall fairness score
            fairness_score = compute_fairness_score(
                [f.get('bias_score', 0) for f in feature_analysis]
            )
            
            # Get most biased feature
            most_biased = get_most_biased_feature(feature_analysis)
            
            # Generate explanations
            explanations = generate_explanations(feature_analysis)
            
            # Get bias trends
            bias_trends = get_bias_trends(feature_analysis)
            
            # Get SHAP-style importance
            shap_importance = compute_shap_style_importance(feature_bias_scores)
            
            # Get feature importance
            feature_importance = get_feature_importance(
                self.df,
                target_column,
                numerical_cols
            )
            
            return {
                'status': 'success',
                'summary': {
                    'fairness_score': fairness_score,
                    'most_biased_feature': most_biased.get('feature') if most_biased else None,
                    'total_features_analyzed': len(feature_analysis),
                    'sensitive_features_detected': self.sensitive_features,
                    'demographic_categories_detected': self.detected_demographics,
                    'dataset_shape': {'rows': df.shape[0], 'columns': df.shape[1]}
                },
                'features': feature_analysis,
                'demographic_detection': demo_detection,
                'explanations': explanations,
                'trends': bias_trends,
                'explainability': shap_importance,
                'feature_importance': feature_importance,
                'recommendations': bias_trends.get('recommendation', '')
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }
