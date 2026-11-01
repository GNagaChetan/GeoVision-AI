import os
import sys
import io
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

client = TestClient(app)

def test_admin_bootstrap_and_login():
    """Verify bootstrapped root administrator can authenticate successfully."""
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@geovision.ai",
        "password": "Admin@GeoVision2025",
        "portal_type": "admin"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    assert data["user"]["email"] == "admin@geovision.ai"


def test_user_registration_and_role_security():
    """Verify user registration works and role cannot be self-elevated to admin."""
    import uuid
    unique_email = f"researcher_{uuid.uuid4().hex[:6]}@geovision.ai"
    res = client.post("/api/v1/auth/signup", json={
        "full_name": "Test Researcher",
        "email": unique_email,
        "password": "SecurePassword123",
        "role": "admin"  # Client attempting to grant itself admin
    })
    assert res.status_code in [200, 201], res.text
    data = res.json()
    # Server MUST force role to 'user'
    assert data["user"]["role"] == "user"

    # Verify user can log in via user portal
    login_res = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword123",
        "portal_type": "user"
    })
    assert login_res.status_code == 200
    user_token = login_res.json()["access_token"]

    # Verify user CANNOT log in via admin portal
    admin_login_res = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword123",
        "portal_type": "admin"
    })
    assert admin_login_res.status_code == 403


def test_admin_endpoints_role_enforcement():
    """Verify /api/v1/auth/admin/* endpoints strictly require role='admin'."""
    import uuid
    test_user_email = f"user_rbac_{uuid.uuid4().hex[:6]}@geovision.ai"
    signup_res = client.post("/api/v1/auth/signup", json={
        "full_name": "RBAC Test User",
        "email": test_user_email,
        "password": "SecurePassword123"
    })
    assert signup_res.status_code in [200, 201]
    user_token = signup_res.json()["access_token"]

    # User attempts to access admin overview
    res = client.get("/api/v1/auth/admin/overview", headers={
        "Authorization": f"Bearer {user_token}"
    })
    assert res.status_code == 403

    # 2. Login as admin
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@geovision.ai",
        "password": "Admin@GeoVision2025",
        "portal_type": "admin"
    })
    admin_token = admin_login.json()["access_token"]

    # Admin accesses admin overview
    admin_res = client.get("/api/v1/auth/admin/overview", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert admin_res.status_code == 200
    overview = admin_res.json()
    assert overview["total_users"] >= 1
    assert overview["total_admins"] >= 1
    assert overview["system_health"]["status"] == "healthy"


def test_chatbot_clean_output_no_raw_latex():
    """Verify Ask GeoVision AI gives clean plain English answers without LaTeX math artifacts."""
    res = client.post("/api/v1/ask-geovision/chat", json={
        "prompt": "How much has the city grown in the last 5 years?",
        "include_rag_context": True
    })
    assert res.status_code == 200
    text = res.json()["response_text"]
    # Verify no raw LaTeX math markers
    assert "$\\to$" not in text
    assert "$[" not in text
    assert "Relevance:" not in text  # Cleaned from fallback dump
    assert "City" in text or "urban" in text or "vegetation" in text


def test_picture_upload_and_multimodal_chat():
    """Verify satellite picture attachment and multimodal interpretation."""
    dummy_image = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
    files = {"file": ("satellite_sample.png", dummy_image, "image/png")}
    upload_res = client.post("/api/v1/ask-geovision/upload-picture", files=files)
    assert upload_res.status_code == 200
    img_data = upload_res.json()
    assert "url" in img_data

    # Send chat referencing uploaded image
    chat_res = client.post("/api/v1/ask-geovision/chat", json={
        "prompt": "What land features do you see in this satellite image?",
        "image_url": img_data["url"]
    })
    assert chat_res.status_code == 200
    assert len(chat_res.json()["response_text"]) > 20


def test_document_upload_and_multimodal_chat():
    """Verify document upload and grounding into knowledge base."""
    dummy_doc = io.BytesIO(b"# Urban Zoning Master Plan 2025\nThe northern wetland reserve is strictly preserved under municipal regulation 41B.")
    files = {"file": ("zoning_plan.md", dummy_doc, "text/markdown")}
    upload_res = client.post("/api/v1/ask-geovision/upload-document", files=files)
    assert upload_res.status_code == 200
    doc_data = upload_res.json()
    assert "zoning_plan.md" in doc_data["document_name"]
    assert doc_data["chunks_indexed"] >= 1

    # Send chat referencing uploaded document
    chat_res = client.post("/api/v1/ask-geovision/chat", json={
        "prompt": "What is the policy for northern wetland reserve?",
        "document_name": "zoning_plan.md"
    })
    assert chat_res.status_code == 200
    assert len(chat_res.json()["response_text"]) > 20
