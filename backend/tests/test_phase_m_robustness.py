"""
Phase M Automated Adversarial Robustness Test Suite
Validates enclave extraction and detection resilience against safe adversarial perturbations:
- URL obfuscation & defanging
- Unicode homoglyph substitutions
- Inserted spaces & character fragmentation
- Phone & UPI punctuation variations
- Repeated noise & payload truncation guards
"""

import pytest
from app.ai.extractors.hybrid_entity_extractor import hybrid_entity_extractor
from app.ai.url_classifier import URLPhishingClassifier
from app.ai.adapters.complaint_classifier import complaint_classifier
from app.ai.adapters.incident_urgency import incident_urgency_adapter


class TestAdversarialRobustness:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.url_classifier = URLPhishingClassifier()

    def test_phone_number_formatting_variants(self):
        """Test extraction of diverse Indian phone number formats under punctuation mutations."""
        variants = [
            "Contact suspect on +919876543210 immediately",
            "Call suspect at +91-98765-43210 for details",
            "Suspect number: (091) 98765 43210",
            "Phone: 98765-43210"
        ]
        for text in variants:
            entities = hybrid_entity_extractor.extract(text)
            phone_entities = [e for e in entities if e.entity_type == "PHONE_NUMBER"]
            assert len(phone_entities) >= 1, f"Failed to extract phone number from: {text}"
            assert "9876543210" in phone_entities[0].normalized_value

    def test_upi_id_formatting_variants(self):
        """Test extraction of UPI VPA formats across banks and punctuation."""
        variants = [
            "Payment went to fraudster.merchant@okaxis",
            "Sent funds to quick-pay_123@icici via GPay",
            "VPA: victim_loss.42@sbi"
        ]
        for text in variants:
            entities = hybrid_entity_extractor.extract(text)
            upi_entities = [e for e in entities if e.entity_type == "UPI_ID"]
            assert len(upi_entities) >= 1, f"Failed to extract UPI ID from: {text}"

    def test_url_defanging_and_obfuscation(self):
        """Test URL extractor resilience against standard defanged notation."""
        text = "Malicious domain observed at https://secure-bank-login[.]xyz/auth and http://192.168.1.1:8080/payload"
        entities = hybrid_entity_extractor.extract(text)
        urls = [e for e in entities if e.entity_type in ["URL", "DOMAIN", "IP_ADDRESS"]]
        assert len(urls) >= 1, "Failed to extract defanged or IP-based URL"

    def test_unicode_homoglyph_url_classification(self):
        """Ensure homoglyph URLs are processed safely without crashing."""
        # Simulated Cyrillic 'а' replacing Latin 'a'
        homoglyph_url = "https://www.bаnk-secure-update.com/login"
        try:
            res = self.url_classifier.predict(homoglyph_url)
            assert "is_phishing" in res or "phishing_probability" in res
        except Exception as e:
            # Model must not crash unhandled on homoglyphs
            assert False, f"Homoglyph parsing crashed: {e}"

    def test_excessive_whitespace_and_line_breaks(self):
        """Ensure narrative with excessive whitespace and multiple newlines does not break triage."""
        noisy_text = "\n\n\n\nScam   incident    reported.\n\n\nTransferred     Rs. 50000 to   suspect@upi.\n\n\n"
        entities = hybrid_entity_extractor.extract(noisy_text)
        assert any(e.entity_type == "UPI_ID" for e in entities)
        assert any(e.entity_type == "AMOUNT" for e in entities)

        urgency = incident_urgency_adapter.predict_urgency(noisy_text)
        assert urgency["urgency_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    def test_oversized_payload_truncation_guard(self):
        """Test system handling of massive repeated character payloads (15,000 characters)."""
        massive_text = "Fraudulent transaction occurred. " * 500
        # Complaint classifier has a 10,000 character truncation guard
        res = complaint_classifier.predict(massive_text)
        assert res["status"] == "SUCCESS"
