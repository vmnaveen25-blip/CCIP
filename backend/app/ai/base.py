from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAIAdapter(ABC):
    """
    Abstract base interface for AI/ML model adapters.
    Trained models can be plugged in later without restructuring the system.
    """

    @property
    @abstractmethod
    def adapter_name(self) -> str:
        """Name/Identifier of the AI adapter."""
        pass

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Whether a trained model is connected and active."""
        pass

    def default_unavailable_response(self, task_name: str) -> Dict[str, Any]:
        """Standard safe response when AI models are not connected."""
        return {
            "status": "NOT_AVAILABLE",
            "message": f"AI analysis service ({task_name}) is not connected.",
            "adapter": self.adapter_name,
            "connected": False
        }
