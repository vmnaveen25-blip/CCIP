"""
Citizen Assistant Service
Coordinates pre-incident threat analysis and portal navigational assistance for citizens.
Ensures explainability, rate safety, and strict derivation from real models.
"""

from typing import Dict, Any, List, Optional
from app.ai.adapters.citizen_assistant import citizen_assistant_adapter
from app.core.logging import logger


class CitizenAssistantService:
    @staticmethod
    def assist_citizen(content: str, query_type: str = "auto") -> Dict[str, Any]:
        """
        Processes citizen query for pre-incident threat screening or portal assistance.
        """
        if not content or not content.strip():
            return {
                "success": False,
                "error": "Query content cannot be empty."
            }

        try:
            result = citizen_assistant_adapter.analyze_threat(content.strip(), query_type=query_type)
            return {
                "success": True,
                **result
            }
        except Exception as e:
            logger.error(f"Error in CitizenAssistantService: {e}")
            return {
                "success": False,
                "error": str(e)
            }


citizen_assistant_service = CitizenAssistantService()
