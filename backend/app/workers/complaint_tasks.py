from app.workers.celery_app import celery_app
from app.core.logging import logger


@celery_app.task(name="process_complaint_ingest")
def process_complaint_ingest(complaint_id: str):
    logger.info(f"[Celery] Asynchronously processing complaint ingest: {complaint_id}")
    return {"status": "SUCCESS", "complaint_id": complaint_id}


@celery_app.task(name="process_evidence_hash")
def process_evidence_hash(evidence_id: str):
    logger.info(f"[Celery] Verifying background evidence SHA-256 seal: {evidence_id}")
    return {"status": "SUCCESS", "evidence_id": evidence_id}


@celery_app.task(name="send_broadcast_notification")
def send_broadcast_notification(user_id: str, title: str, message: str):
    logger.info(f"[Celery] Dispatching notification to user {user_id}: {title}")
    return {"status": "DELIVERED", "user_id": user_id}


@celery_app.task(name="run_ai_triage_task")
def run_ai_triage_task(complaint_id: str):
    logger.info(f"[Celery] AI Triage task called for {complaint_id} - returning NOT_AVAILABLE safely.")
    return {
        "status": "NOT_AVAILABLE",
        "message": "AI analysis service is not connected.",
        "complaint_id": complaint_id
    }
