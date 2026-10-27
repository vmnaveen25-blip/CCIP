"""
AI Model Verification & Testing API Endpoints
Provides developer verification routes and lazy-load status inspection
for local DistilBERT and XGBoost machine learning models.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.core.logging import logger
from app.ai.model_manager import model_manager
from app.ai.email_classifier import email_classifier
from app.ai.sms_classifier import sms_classifier
from app.ai.url_classifier import url_classifier
from app.ai.adapters.complaint_classifier import complaint_classifier

router = APIRouter(prefix="/ai", tags=["AI/ML Model Runtime Verification"])


# -----------------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------------
class TextInferenceRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Raw input text to evaluate")


class URLInferenceRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048, description="Target URL to analyze for phishing")


# -----------------------------------------------------------------------------
# Status Endpoint (Zero Model Loading)
# -----------------------------------------------------------------------------
@router.get("/models/status", summary="Inspect lazy-load status of local trained AI models")
async def get_models_status():
    """
    Returns the availability and memory-load status of all three local machine learning models:
    - Email Threat (DistilBERT)
    - SMS Spam (DistilBERT)
    - URL Phishing (XGBoost)

    Does NOT load model weights into memory.
    """
    return model_manager.get_status()


# -----------------------------------------------------------------------------
# Developer Verification: Email Threat Model
# -----------------------------------------------------------------------------
@router.post(
    "/test/email",
    summary="Developer verification route for real DistilBERT Email Threat inference"
)
async def test_email_threat(req: TextInferenceRequest):
    """
    Executes real inference on raw email body using local DistilBERT weights.
    Applies calibrated decision threshold and returns genuine probabilities.
    Returns structured MODEL_NOT_DEPLOYED status if model artifacts are not present.
    """
    try:
        result = email_classifier.predict(req.text)
        return result
    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "INVALID_INPUT",
                "model": "email_threat",
                "message": str(e)
            }
        )
    except FileNotFoundError as e:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "MODEL_NOT_DEPLOYED",
                "available": False,
                "model": "email_threat",
                "message": "Model artifact is not currently deployed."
            }
        )
    except RuntimeError as e:
        logger.warning(f"Email threat model runtime error: {e}")
        err_msg = str(e)
        if "not found" in err_msg.lower() or "missing" in err_msg.lower():
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "status": "MODEL_NOT_DEPLOYED",
                    "available": False,
                    "model": "email_threat",
                    "message": "Model artifact is not currently deployed."
                }
            )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "RUNTIME_DEPENDENCY_MISSING",
                "available": False,
                "model": "email_threat",
                "message": err_msg or "Required runtime dependency is unavailable."
            }
        )
    except Exception as e:
        logger.error(f"Email threat inference error: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "MODEL_NOT_DEPLOYED",
                "available": False,
                "model": "email_threat",
                "message": "Model artifact is not currently deployed."
            }
        )


# -----------------------------------------------------------------------------
# Developer Verification: SMS Spam Model
# -----------------------------------------------------------------------------
@router.post(
    "/test/sms",
    summary="Developer verification route for real DistilBERT SMS Spam inference"
)
async def test_sms_spam(req: TextInferenceRequest):
    """
    Executes real inference on raw SMS text using local DistilBERT weights.
    Applies calibrated spam threshold and returns genuine probabilities.
    Returns structured MODEL_NOT_DEPLOYED status if model artifacts are not present.
    """
    try:
        result = sms_classifier.predict(req.text)
        return result
    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "INVALID_INPUT",
                "model": "sms_spam",
                "message": str(e)
            }
        )
    except FileNotFoundError as e:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "MODEL_NOT_DEPLOYED",
                "available": False,
                "model": "sms_spam",
                "message": "Model artifact is not currently deployed."
            }
        )
    except RuntimeError as e:
        logger.warning(f"SMS spam model runtime error: {e}")
        err_msg = str(e)
        if "not found" in err_msg.lower() or "missing" in err_msg.lower():
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "status": "MODEL_NOT_DEPLOYED",
                    "available": False,
                    "model": "sms_spam",
                    "message": "Model artifact is not currently deployed."
                }
            )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "RUNTIME_DEPENDENCY_MISSING",
                "available": False,
                "model": "sms_spam",
                "message": err_msg or "Required runtime dependency is unavailable."
            }
        )
    except Exception as e:
        logger.error(f"SMS spam inference error: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "MODEL_NOT_DEPLOYED",
                "available": False,
                "model": "sms_spam",
                "message": "Model artifact is not currently deployed."
            }
        )


# -----------------------------------------------------------------------------
# Developer Verification: URL Phishing Model
# -----------------------------------------------------------------------------
@router.post(
    "/test/url",
    summary="Developer verification route for real XGBoost URL Phishing inference"
)
async def test_url_phishing(req: URLInferenceRequest):
    """
    Extracts 30 heuristic features and executes real inference on URL
    using local XGBoost classifier. Returns genuine probabilities.
    """
    try:
        result = url_classifier.predict(req.url)
        return result
    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "INVALID_INPUT",
                "model": "url_phishing",
                "message": str(e)
            }
        )
    except RuntimeError as e:
        logger.error(f"URL phishing model loading failed: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "MODEL_LOAD_FAILED",
                "model": "url_phishing",
                "message": "The AI model could not be initialized."
            }
        )
    except Exception as e:
        logger.error(f"URL phishing inference error: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "INFERENCE_ERROR",
                "model": "url_phishing",
                "message": "Failed to complete AI model inference."
            }
        )


# -----------------------------------------------------------------------------
# Developer Verification: Complaint Classifier Model
# -----------------------------------------------------------------------------
@router.post(
    "/test/complaint",
    summary="Developer verification route for real DeBERTa-v3 Complaint Classifier inference"
)
async def test_complaint_classifier(req: TextInferenceRequest):
    """
    Executes real multi-label inference on complaint narrative using local DeBERTa-v3 weights.
    Applies calibrated per-label thresholds and returns genuine predictions.
    """
    try:
        result = complaint_classifier.predict(req.text)
        return result
    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "INVALID_INPUT",
                "model": "complaint_classifier",
                "message": str(e)
            }
        )
    except FileNotFoundError as e:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "MODEL_NOT_DEPLOYED",
                "available": False,
                "model_available": False,
                "fallback_mode": False,
                "model": "complaint_classifier",
                "message": "Complaint Classifier model weights not found in local enclave.",
                "is_cybercrime": False,
                "predictions": []
            }
        )
    except RuntimeError as e:
        logger.warning(f"Complaint classifier runtime error: {e}")
        if not complaint_classifier.is_available or "not found" in str(e).lower():
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "status": "MODEL_NOT_DEPLOYED",
                    "available": False,
                    "model_available": False,
                    "fallback_mode": False,
                    "model": "complaint_classifier",
                    "message": "Complaint Classifier model weights not found in local enclave.",
                    "is_cybercrime": False,
                    "predictions": []
                }
            )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "LOAD_FAILED",
                "available": False,
                "model_available": False,
                "model": "complaint_classifier",
                "message": str(e)
            }
        )
    except Exception as e:
        logger.error(f"Complaint classifier inference error: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "ERROR",
                "available": False,
                "model_available": False,
                "model": "complaint_classifier",
                "message": "Inference processing failed."
            }
        )


# -----------------------------------------------------------------------------
# AI Assistant / LLM Copilot Status & Query
# -----------------------------------------------------------------------------
from app.ai.adapters.investigation_assistant import investigation_assistant


class AssistantQueryRequest(BaseModel):
    text: Optional[str] = Field(default=None, description="Prompt or query text")
    prompt: Optional[str] = Field(default=None, description="Alternative field name for prompt")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Case context or metadata")

    def get_prompt_text(self) -> str:
        return (self.text or self.prompt or "").strip()


@router.get("/assistant/status", summary="Inspect AI Assistant status and initialization")
async def get_assistant_status():
    """
    Returns the initialization status of the AI Assistant and LLM client.
    Ensures API key is never exposed in plaintext.
    """
    return investigation_assistant.get_status()


@router.post("/assistant/query", summary="Query the AI Investigation Assistant")
async def query_ai_assistant(req: AssistantQueryRequest):
    """
    Executes real LLM prompt evaluation through the AI Assistant.
    """
    prompt_str = req.get_prompt_text()
    if not prompt_str:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"error": "INVALID_INPUT", "message": "Query text or prompt cannot be empty."}
        )
    return await investigation_assistant.generate_response(prompt_str, req.context)

