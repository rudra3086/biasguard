import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from enum import Enum


class SeverityLevel(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


def compute_approval_rate(group_data: pd.Series, task_type: str = 'classification') -> float:
    """
    Compute approval/positive prediction rate for a group.
    
    Args:
        group_data: Series of target values for the group
        task_type: 'classification' or 'regression'
        
    Returns:
        Approval rate (0-1)
    """
    if len(group_data) == 0:
        return 0.0
    
    if task_type == 'classification':
        # For binary classification, compute percentage of positive class (1)
        positive_rate = (group_data == 1).sum() / len(group_data)
        return round(positive_rate, 4)
    else:
        # For regression, return mean value
        return round(group_data.mean(), 4)


def compute_bias_metrics(rates: Dict[str, float]) -> Tuple[float, float]:
    """
    Compute bias metrics from approval rates.
    
    Args:
        rates: Dictionary mapping group names to approval rates
        
    Returns:
        Tuple of (bias_score, bias_ratio)
    """
    if not rates or len(rates) < 2:
        return 0.0, 1.0
    
    rate_values = list(rates.values())
    max_rate = max(rate_values)
    min_rate = min(rate_values)
    
    # Difference-based bias
    bias_score = max_rate - min_rate
    
    # Ratio-based bias (min/max)
    bias_ratio = min_rate / max_rate if max_rate > 0 else 0.0
    
    return round(bias_score, 4), round(bias_ratio, 4)


def classify_severity(bias_score: float) -> str:
    """
    Classify bias severity level.
    
    Args:
        bias_score: Computed bias score
        
    Returns:
        Severity level string
    """
    if bias_score < 0.1:
        return SeverityLevel.LOW.value
    elif bias_score < 0.3:
        return SeverityLevel.MEDIUM.value
    else:
        return SeverityLevel.HIGH.value


def analyze_feature(df: pd.DataFrame, feature: str, target_col: str, 
                   task_type: str = 'classification') -> Optional[Dict]:
    """
    Analyze a single feature for bias.
    
    Args:
        df: DataFrame with data
        feature: Feature column name
        target_col: Target column name
        task_type: 'classification' or 'regression'
        
    Returns:
        Dictionary with bias analysis or None if feature cannot be analyzed
    """
    if feature not in df.columns or target_col not in df.columns:
        return None
    
    # Remove NaN values
    valid_data = df[[feature, target_col]].dropna()
    
    if len(valid_data) < 10:
        return None
    
    # Get unique groups
    groups = valid_data[feature].unique()
    
    if len(groups) < 2:
        return None
    
    # Compute approval rates per group
    approval_rates = {}
    group_counts = {}
    
    for group in groups:
        group_data = valid_data[valid_data[feature] == group][target_col]
        rate = compute_approval_rate(group_data, task_type)
        approval_rates[str(group)] = rate
        group_counts[str(group)] = len(group_data)
    
    # Compute bias metrics
    bias_score, bias_ratio = compute_bias_metrics(approval_rates)
    
    # Classify severity
    severity = classify_severity(bias_score)
    
    return {
        'feature': feature,
        'type': 'categorical',
        'groups': approval_rates,
        'group_counts': group_counts,
        'bias_score': bias_score,
        'bias_ratio': bias_ratio,
        'severity': severity,
        'groups_affected': len(groups)
    }


def compute_fairness_score(bias_scores: List[float]) -> float:
    """
    Compute overall fairness score.
    
    Args:
        bias_scores: List of individual feature bias scores
        
    Returns:
        Overall fairness score (0-1)
    """
    if not bias_scores:
        return 1.0
    
    # Fairness score = 1 - average bias
    avg_bias = np.mean(bias_scores)
    fairness_score = max(0, 1.0 - avg_bias)
    
    return round(fairness_score, 4)


def get_most_biased_feature(feature_analysis: List[Dict]) -> Optional[Dict]:
    """
    Get the most biased feature from analysis results.
    
    Args:
        feature_analysis: List of feature analysis dictionaries
        
    Returns:
        Dictionary of most biased feature or None
    """
    if not feature_analysis:
        return None
    
    sorted_features = sorted(
        feature_analysis,
        key=lambda x: x.get('bias_score', 0),
        reverse=True
    )
    
    return sorted_features[0] if sorted_features else None


def filter_features_by_severity(feature_analysis: List[Dict], 
                               min_severity: str = 'MEDIUM') -> List[Dict]:
    """
    Filter features by minimum severity level.
    
    Args:
        feature_analysis: List of feature analysis dictionaries
        min_severity: Minimum severity to include ('LOW', 'MEDIUM', 'HIGH')
        
    Returns:
        Filtered list of features
    """
    severity_rank = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2}
    min_rank = severity_rank.get(min_severity, 1)
    
    return [
        f for f in feature_analysis
        if severity_rank.get(f.get('severity', 'LOW'), 0) >= min_rank
    ]
