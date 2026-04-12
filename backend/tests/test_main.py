import base64
import pytest
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_base64_conversion_logic():
    # Teste unitário simples da lógica de codificação
    test_data = b"fake image content"
    encoded = base64.b64encode(test_data).decode("utf-8")
    content_type = "image/png"
    data_uri = f"data:{content_type};base64,{encoded}"
    
    assert data_uri.startswith("data:image/png;base64,")
    assert "fake image content" not in data_uri # Deve estar codificado
    
    # Decodificar de volta para validar
    pure_base64 = data_uri.split(",")[1]
    decoded = base64.b64decode(pure_base64)
    assert decoded == test_data
