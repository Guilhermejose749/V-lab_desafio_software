import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def owner_token(client):
    """Cria o usuário DONO e retorna os headers de autenticação"""
    email = f"owner_{uuid.uuid4()}@teste.com"
    client.post("/auth/register", json={
        "name": "Dono do Curso", 
        "email": email, 
        "password": "password123"
    })
    res = client.post("/auth/login", data={
        "username": email, 
        "password": "password123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def intruder_token(client):
    """Cria o usuário INTRUSO e retorna os headers de autenticação"""
    email = f"intruso_{uuid.uuid4()}@teste.com"
    client.post("/auth/register", json={
        "name": "Intruso", 
        "email": email, 
        "password": "password123"
    })
    res = client.post("/auth/login", data={
        "username": email, 
        "password": "password123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def setup_course(client, owner_token):
    """Cria um curso como DONO e retorna o ID do curso"""
    payload = {
        "name": "Curso Base",
        "description": "Curso para testes",
        "start_date": "2026-06-01",
        "end_date": "2026-06-10"
    }
    res = client.post("/courses/", json=payload, headers=owner_token)
    return res.json()["id"]

@pytest.fixture(scope="module")
def setup_lesson(client, owner_token, setup_course):
    """Cria uma aula no curso base como DONO e retorna o ID da aula"""
    payload = {
        "title": "Aula Base",
        "status": "draft",
        "course_id": setup_course
    }
    res = client.post("/lessons/", json=payload, headers=owner_token)
    return res.json()["id"]