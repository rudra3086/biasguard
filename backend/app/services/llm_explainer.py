"""
Gemini API-based Bias Analysis Explainer

Uses Google Gemini to generate human-readable explanations for bias analysis results.
"""

import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class LLMExplainer:
    """Service for generating AI explanations of bias analysis results using Gemini API."""
    
    def __init__(self):
        """Initialize the LLM explainer with Gemini API."""
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.use_gemini = bool(self.api_key)
        
        if self.use_gemini:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Gemini API client initialized successfully")
            except ImportError:
                logger.warning("google-generativeai not installed. Using fallback explanations.")
                self.use_gemini = False
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini API: {e}. Using fallback explanations.")
                self.use_gemini = False
    
    def generate_explanation(self, bias_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive AI explanation for bias analysis results using Gemini.
        
        Args:
            bias_analysis: Dictionary with bias analysis results from backend
            
        Returns:
            Dictionary with explanation components
        """
        try:
            if self.use_gemini:
                return self._generate_with_gemini(bias_analysis)
            else:
                return self._generate_fallback_explanation(bias_analysis)
        except Exception as e:
            logger.error(f"Error generating explanation: {e}")
            return self._generate_fallback_explanation(bias_analysis)
    
    def _generate_with_gemini(self, bias_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate explanation using Gemini API."""
        try:
            prompt = self._create_bias_prompt(bias_analysis)
            response = self.client.generate_content(prompt)
            explanation_text = response.text
            
            # Parse response
            explanation = self._parse_gemini_response(explanation_text, bias_analysis)
            
            logger.info("Successfully generated explanation using Gemini API")
            return explanation
            
        except Exception as e:
            logger.error(f"Gemini API error: {e}. Falling back to template explanations.")
            return self._generate_fallback_explanation(bias_analysis)
    
    def _create_bias_prompt(self, bias_analysis: Dict[str, Any]) -> str:
        """Create a prompt for Gemini to analyze bias in the dataset."""
        features = bias_analysis.get('features', [])
        summary = bias_analysis.get('summary', {})
        trends = bias_analysis.get('trends', {})
        
        # Build detailed feature breakdown with approval rates per group
        feature_details = []
        for f in features:
            feature_name = f.get('feature', 'Unknown')
            bias_score = f.get('bias_score', 0)
            severity = f.get('severity', 'UNKNOWN')
            groups = f.get('groups', {})
            approval_rates = f.get('approval_rates', {})
            
            # Build group-level approval rates
            group_breakdown = []
            for group_name, group_data in groups.items():
                approval_rate = approval_rates.get(group_name, 0)
                group_breakdown.append(f"  • {group_name}: {approval_rate:.1%} approval rate")
            
            feature_detail = f"""
DEMOGRAPHIC FEATURE: {feature_name}
  Bias Score: {bias_score:.2f} (0=No Bias, 1=Maximum Bias)
  Severity Level: {severity}
  Demographic Groups Identified:
{chr(10).join(group_breakdown)}"""
            feature_details.append(feature_detail)
        
        features_section = "".join(feature_details[:6])  # Top 6 features
        
        prompt = f"""You are an expert in data fairness and bias detection. Analyze this real dataset and provide a detailed text-based assessment of demographic bias found in the data.

==== DATASET BIAS ANALYSIS RESULTS ====

OVERALL FAIRNESS SCORE: {summary.get('fairness_score', 0):.1%}
(Scale: 0% = Severe Bias, 50% = Moderate Bias, 100% = Fair)

ANALYSIS SUMMARY:
- Total Demographic Features Analyzed: {trends.get('total_features_analyzed', 0)}
- Features with HIGH Bias: {trends.get('high_bias_count', 0)}
- Features with MEDIUM Bias: {trends.get('medium_bias_count', 0)}
- Features with LOW Bias: {trends.get('low_bias_count', 0)}

DETAILED DEMOGRAPHIC BREAKDOWN:
{features_section}

==== ANALYSIS REQUIRED ====

Please provide a comprehensive analysis covering:

1. **DEMOGRAPHIC DISPARITIES**: Identify which demographic groups are disadvantaged or advantaged in the dataset. Be specific about approval rate differences.

2. **BIAS SEVERITY**: Explain which demographic features show the most severe bias and why this matters.

3. **AFFECTED POPULATIONS**: List the specific demographic groups that face discrimination or unequal treatment.

4. **KEY PATTERNS**: Identify recurring patterns of bias across multiple demographic features.

5. **RISK ASSESSMENT**: Evaluate the fairness risk level (Critical/High/Medium/Low) if this dataset were used for automated decisions.

6. **ACTIONABLE RECOMMENDATIONS**: Provide specific, practical steps to mitigate the identified biases.

7. **LEGAL & ETHICAL CONCERNS**: Highlight any bias patterns that could lead to discrimination violations.

Keep your analysis grounded in the actual data presented above. Use specific numbers and percentages. Be direct and don't use hedging language."""

        return prompt
    
    def _parse_gemini_response(self, response_text: str, bias_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Gemini response and structure it."""
        return {
            "status": "success",
            "model": "gemini-1.5-flash",
            "analysis": response_text,
            "fairness_score": bias_analysis.get('summary', {}).get('fairness_score', 0),
            "high_bias_count": bias_analysis.get('trends', {}).get('high_bias_count', 0),
            "medium_bias_count": bias_analysis.get('trends', {}).get('medium_bias_count', 0),
        }
    
    def _generate_fallback_explanation(self, bias_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate explanation without Gemini API."""
        features = bias_analysis.get('features', [])
        summary = bias_analysis.get('summary', {})
        fairness_score = summary.get('fairness_score', 0)
        
        # Find most biased features
        high_bias_features = [f for f in features if f.get('severity') == 'HIGH']
        medium_bias_features = [f for f in features if f.get('severity') == 'MEDIUM']
        
        # Generate assessment based on actual fairness score
        if fairness_score < 0.3:
            assessment = "CRITICAL BIAS DETECTED: This dataset shows severe demographic bias with significant disparities between demographic groups."
            risk_level = "CRITICAL"
        elif fairness_score < 0.5:
            assessment = "SIGNIFICANT BIAS DETECTED: This dataset contains substantial demographic bias that would likely result in discriminatory outcomes if used for automated decisions."
            risk_level = "HIGH"
        elif fairness_score < 0.7:
            assessment = "MODERATE BIAS DETECTED: This dataset shows notable fairness concerns affecting specific demographic groups."
            risk_level = "MEDIUM"
        elif fairness_score < 0.85:
            assessment = "MINOR BIAS DETECTED: This dataset shows some fairness issues but they are relatively contained."
            risk_level = "LOW"
        else:
            assessment = "FAIR DATASET: This dataset demonstrates good fairness across demographic groups with minimal bias concerns."
            risk_level = "MINIMAL"
        
        # Build demographic breakdown from features
        demographic_breakdown = []
        for f in high_bias_features[:4]:
            feature_name = f.get('feature', 'Unknown')
            bias_score = f.get('bias_score', 0)
            groups = f.get('groups', {})
            approval_rates = f.get('approval_rates', {})
            
            if approval_rates:
                rates_text = ", ".join([f"{g}: {r:.1%}" for g, r in approval_rates.items()])
                demographic_breakdown.append(f"• {feature_name} - Approval rates: {rates_text} (Bias: {bias_score:.1%})")
            else:
                demographic_breakdown.append(f"• {feature_name} - Bias Score: {bias_score:.1%}")
        
        # Build recommendations
        recommendations = []
        if high_bias_features:
            for f in high_bias_features[:3]:
                feature = f.get('feature', 'Unknown')
                bias_score = f.get('bias_score', 0)
                recommendations.append(f"Address critical bias in {feature}: {bias_score:.1%} disparity between groups")
        
        if medium_bias_features and len(recommendations) < 3:
            for f in medium_bias_features[:2]:
                feature = f.get('feature', 'Unknown')
                recommendations.append(f"Monitor {feature} for bias trends and disparities")
        
        if not recommendations:
            recommendations.append("Continue monitoring for emerging bias patterns")
        
        analysis_text = f"""{assessment}

FAIRNESS ASSESSMENT:
- Overall Fairness Score: {fairness_score:.1%}
- Risk Level: {risk_level}
- High Severity Bias: {len(high_bias_features)} feature(s)
- Medium Severity Bias: {len(medium_bias_features)} feature(s)

DEMOGRAPHIC DISPARITIES IDENTIFIED:
{chr(10).join(demographic_breakdown) if demographic_breakdown else "• No high-bias features detected"}

CRITICAL RECOMMENDATIONS:
{chr(10).join([f"• {r}" for r in recommendations])}

NEXT STEPS:
- Review data collection processes for potential bias sources
- Consult with fairness experts to validate findings
- Implement fairness constraints in model development
- Monitor deployed models for bias in predictions"""
        
        return {
            "status": "success",
            "model": "fallback",
            "analysis": analysis_text,
            "fairness_score": fairness_score,
            "high_bias_count": len(high_bias_features),
            "medium_bias_count": len(medium_bias_features),
        }
