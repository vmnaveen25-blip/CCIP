"""
Complaint Classifier Module
Re-exports ComplaintClassifier and complaint_classifier instance.
"""

from app.ai.adapters.complaint_classifier import ComplaintClassifier, complaint_classifier

__all__ = ["ComplaintClassifier", "complaint_classifier"]
