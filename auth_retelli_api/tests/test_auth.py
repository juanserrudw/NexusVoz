import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "message": "API funcionando correctamente"}

def test_register_user():
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "testpassword123"
    }
    response = client.post("/register", json=user_data)
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"

def test_login_user():
    # Primero registrar un usuario
    user_data = {
        "email": "login@example.com",
        "username": "loginuser",
        "full_name": "Login User",
        "password": "loginpassword123"
    }
    client.post("/register", json=user_data)
    
    # Luego intentar hacer login
    login_data = {
        "email": "login@example.com",
        "password": "loginpassword123"
    }
    response = client.post("/login", json=login_data)
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"