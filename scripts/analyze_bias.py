#!/usr/bin/env python3
import sys
import json
import pandas as pd
from pathlib import Path

def identify_protected_attributes(df):
    """Auto-detect potential protected attributes in the dataset"""
    protected = []
    demographic_keywords = ['education', 'gender', 'race', 'age', 'employed', 'employment', 'marital']
    
    for col in df.columns:
        col_lower = col.lower()
        if any(keyword in col_lower for keyword in demographic_keywords):
            protected.append(col)
    
    return protected

def calculate_approval_rate(data, target_col='loan_status'):
    """Calculate approval rate for a group"""
    if len(data) == 0:
        return 0.0
    
    try:
        # Convert to string and handle both text and numeric values
        target_values = data[target_col].astype(str).str.strip().str.lower()
        approved = target_values.str.contains('approved|yes|1', regex=True, na=False).sum()
        return round((approved / len(data)) * 100, 2)
    except Exception:
        return 0.0

def analyze_feature_bias(df, feature, target_col='loan_status'):
    """Analyze bias for a specific feature"""
    if feature not in df.columns:
        return None
    
    # Remove rows with NaN in feature or target column
    valid_data = df[[feature, target_col]].dropna()
    if len(valid_data) < 10:
        return None
    
    groups = valid_data[feature].unique()
    if len(groups) < 2:
        return None
    
    approval_rates = {}
    group_counts = {}

    for group in groups:
        group_data = valid_data[valid_data[feature] == group]
        approval_rate = calculate_approval_rate(group_data, target_col)
        approval_rates[str(group)] = approval_rate
        group_counts[str(group)] = len(group_data)

    # Calculate disparate impact (4/5 rule)
    rates = list(approval_rates.values())
    if len(rates) >= 2 and max(rates) > 0:
        disparate_impact = round(min(rates) / max(rates), 2)
    else:
        disparate_impact = 1.0

    # Determine severity
    if disparate_impact < 0.8:
        severity = 'critical'
    elif disparate_impact < 0.9:
        severity = 'high'
    elif disparate_impact < 0.95:
        severity = 'medium'
    else:
        severity = 'low'

    variance = round(max(rates) - min(rates), 2)

    return {
        'feature': feature,
        'disparate_impact': disparate_impact,
        'approval_rates': approval_rates,
        'variance': variance,
        'severity': severity,
        'groups_affected': len(groups),
        'group_counts': group_counts
    }

def analyze_bias(filepath):
    """Main bias analysis function"""
    try:
        df = pd.read_csv(filepath)
    except:
        df = pd.read_json(filepath)

    # Find target column (approval status)
    target_col = None
    for col in df.columns:
        if any(keyword in col.lower() for keyword in ['status', 'approved', 'approval', 'outcome']):
            target_col = col
            break

    if not target_col:
        target_col = df.columns[-1]

    # Identify protected attributes
    protected_attrs = identify_protected_attributes(df)
    if not protected_attrs:
        protected_attrs = [col for col in df.columns if col != target_col][:3]

    # Analyze each feature
    biased_features = []
    total_bias_score = 0

    for feature in protected_attrs:
        analysis = analyze_feature_bias(df, feature, target_col)
        if analysis:
            biased_features.append(analysis)
            if analysis['severity'] != 'low':
                total_bias_score += (1 - analysis['disparate_impact'])

    # Calculate fairness score
    fairness_score = max(50, 100 - int(total_bias_score * 50))

    # Determine overall bias
    bias_detected = any(f['severity'] in ['critical', 'high'] for f in biased_features)

    # Generate explanation
    critical_features = [f for f in biased_features if f['severity'] == 'critical']
    if critical_features:
        explanation = f"CRITICAL: {len(critical_features)} feature(s) show severe disparate impact. "
        explanation += f"Features: {', '.join([f['feature'] for f in critical_features])}"
    else:
        high_features = [f for f in biased_features if f['severity'] == 'high']
        if high_features:
            explanation = f"WARNING: {len(high_features)} feature(s) show high disparate impact."
        else:
            explanation = "Model fairness is reasonable across analyzed features."

    result = {
        'fairness_score': fairness_score,
        'bias_detected': bias_detected,
        'total_samples': len(df),
        'demographic_groups': len(protected_attrs),
        'biased_features': biased_features,
        'explanation': explanation,
        'approval_rates': {},
        'disparate_impact': max([f['disparate_impact'] for f in biased_features], default=1.0)
    }

    # Calculate overall approval rate
    try:
        target_values = df[target_col].astype(str).str.strip().str.lower()
        overall_approved = target_values.str.contains('approved|yes|1', regex=True, na=False).sum()
        result['approval_rates']['overall'] = round((overall_approved / len(df)) * 100, 2)
    except Exception:
        result['approval_rates']['overall'] = 0.0

    print(json.dumps(result))

if __name__ == '__main__':
    if len(sys.argv) > 1:
        analyze_bias(sys.argv[1])
    else:
        print(json.dumps({'error': 'No file path provided'}))
