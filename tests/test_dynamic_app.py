import pytest
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint directly."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_dynamic_routes_exist():
    """Dynamically checks that all expected endpoints are registered in the application."""
    routes = [route.path for route in app.routes]
    
    expected_prefixes = [
        "/students",
        "/classes",
        "/attendance",
        "/payments",
        "/users",
        "/auth",
        "/dashboard"
    ]
    
    for prefix in expected_prefixes:
        assert any(route.startswith(prefix) for route in routes), f"Route prefix {prefix} not found dynamically!"

def test_dynamic_get_endpoints():
    """Dynamically test all GET endpoints that do not require path parameters."""
    for route in app.routes:
        if hasattr(route, "methods") and "GET" in route.methods:
            # Skip routes with path parameters for generic testing
            if "{" not in route.path:
                try:
                    # Some endpoints might require authentication, so 401/403 are also acceptable responses in a dynamic test
                    response = client.get(route.path)
                    assert response.status_code in [200, 401, 403], f"Endpoint {route.path} failed with status {response.status_code}"
                except Exception as e:
                    pytest.fail(f"Dynamic test failed for {route.path} with error: {str(e)}")
