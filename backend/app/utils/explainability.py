import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import warnings

warnings.filterwarnings('ignore')


def get_feature_importance(df: pd.DataFrame, target_col: str, 
                          numerical_cols: List[str]) -> Optional[Dict]:
    """
    Compute feature importance using correlation analysis.
    
    Args:
        df: Input DataFrame
        target_col: Target column name
        numerical_cols: List of numerical columns
        
    Returns:
        Dictionary with feature importance scores
    """
    try:
        df_numeric = df[numerical_cols + [target_col]].copy()
        
        # Handle missing values
        df_numeric = df_numeric.dropna()
        
        if df_numeric.shape[0] < 2:
            return None
        
        correlations = df_numeric.corr()[target_col].drop(target_col)
        feature_importance = {
            col: abs(corr) for col, corr in correlations.items()
        }
        
        return dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
    except Exception:
        return None


def compute_shap_style_importance(feature_bias_scores: Dict[str, float]) -> Dict:
    """
    Compute SHAP-style explainability using bias scores.
    
    Args:
        feature_bias_scores: Dictionary mapping features to bias scores
        
    Returns:
        Dictionary with top contributing features
    """
    sorted_features = sorted(
        feature_bias_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )
    
    top_features = sorted_features[:5]
    
    return {
        'top_biased_features': [
            {
                'feature': feat,
                'bias_contribution': score,
                'impact_percentage': round((score / sum(feature_bias_scores.values())) * 100, 2)
                if sum(feature_bias_scores.values()) > 0 else 0
            }
            for feat, score in top_features
        ],
        'total_bias_score': sum(feature_bias_scores.values())
    }


def generate_explanations(feature_analysis: List[Dict]) -> Dict[str, str]:
    """
    Generate human-readable explanations for bias findings.
    
    Args:
        feature_analysis: List of feature analysis dictionaries
        
    Returns:
        Dictionary mapping feature names to explanation strings
    """
    explanations = {}
    
    for feature in feature_analysis:
        feat_name = feature.get('feature', 'Unknown')
        bias_score = feature.get('bias_score', 0)
        severity = feature.get('severity', 'UNKNOWN')
        groups = feature.get('groups', {})
        
        if not groups:
            continue
        
        max_group = max(groups, key=groups.get)
        min_group = min(groups, key=groups.get)
        max_rate = groups[max_group]
        min_rate = groups[min_group]
        
        difference = round((max_rate - min_rate) * 100, 1)
        
        explanation = (
            f"The feature '{feat_name}' shows {severity} bias. "
            f"Group '{max_group}' has a {max_rate*100:.1f}% approval rate, "
            f"while '{min_group}' has {min_rate*100:.1f}%, "
            f"a difference of {difference}%. "
        )
        
        if severity == 'HIGH':
            explanation += "This significant disparity requires immediate attention."
        elif severity == 'MEDIUM':
            explanation += "This moderate disparity should be investigated further."
        else:
            explanation += "This minor disparity is within acceptable range."
        
        explanations[feat_name] = explanation
    
    return explanations


def get_bias_trends(feature_analysis: List[Dict]) -> Dict:
    """
    Extract bias trends across features.
    
    Args:
        feature_analysis: List of feature analysis dictionaries
        
    Returns:
        Dictionary with trend information
    """
    if not feature_analysis:
        return {'trend': 'No data to analyze'}
    
    severity_counts = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
    
    for feature in feature_analysis:
        severity = feature.get('severity', 'LOW')
        if severity in severity_counts:
            severity_counts[severity] += 1
    
    total_features = len(feature_analysis)
    
    trends = {
        'total_features_analyzed': total_features,
        'high_bias_count': severity_counts['HIGH'],
        'medium_bias_count': severity_counts['MEDIUM'],
        'low_bias_count': severity_counts['LOW'],
        'high_bias_percentage': round((severity_counts['HIGH'] / total_features * 100), 2) if total_features > 0 else 0,
        'recommendation': generate_recommendation(severity_counts, total_features)
    }
    
    return trends


def generate_recommendation(severity_counts: Dict[str, int], total: int) -> str:
    """
    Generate recommendation based on bias findings.
    
    Args:
        severity_counts: Dictionary with severity counts
        total: Total number of features
        
    Returns:
        Recommendation string
    """
    high_pct = (severity_counts['HIGH'] / total * 100) if total > 0 else 0
    
    if high_pct >= 50:
        return "CRITICAL: Multiple high-bias features detected. Model requires substantial remediation."
    elif high_pct >= 25:
        return "ALERT: Several high-bias features detected. Recommend immediate investigation and mitigation."
    elif severity_counts['HIGH'] > 0:
        return "WARNING: Some high-bias features detected. Consider bias mitigation strategies."
    elif severity_counts['MEDIUM'] > 0:
        return "INFO: Moderate bias detected. Monitor and plan for improvement."
    else:
        return "PASS: Dataset shows acceptable fairness levels across analyzed features."
