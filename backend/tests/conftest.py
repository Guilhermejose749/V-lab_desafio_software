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
    
    # Tenta registrar
    res_reg = client.post("/auth/register", json={
        "name": "Dono do Curso", 
        "email": email, 
        "password": "password123"
    })
    assert res_reg.status_code in [200, 201], f"Erro ao registrar DONO: {res_reg.text}"
    
    # Tenta logar
    res_login = client.post("/api/auth/login", data={
        "username": email, 
        "password": "password123"
    })
    assert res_login.status_code == 200, f"Erro no login DONO: {res_login.text}"
    
    token = res_login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def intruder_token(client):
    """Cria o usuário INTRUSO e retorna os headers de autenticação"""
    email = f"intruso_{uuid.uuid4()}@teste.com"
    
    res_reg = client.post("/api/auth/register", json={
        "name": "Intruso", 
        "email": email, 
        "password": "password123"
    })
    assert res_reg.status_code in [200, 201], f"Erro ao registrar INTRUSO: {res_reg.text}"
    
    res_login = client.post("/api/auth/login", data={
        "username": email, 
        "password": "password123"
    })
    assert res_login.status_code == 200, f"Erro no login INTRUSO: {res_login.text}"
    
    token = res_login.json()["access_token"]
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
    res = client.post("/api/courses/", json=payload, headers=owner_token)
    assert res.status_code in [200, 201], f"Erro ao criar CURSO base: {res.text}"
    return res.json()["id"]

@pytest.fixture(scope="module")
def setup_lesson(client, owner_token, setup_course):
    """Cria uma aula no curso base como DONO e retorna o ID da aula"""
    payload = {
        "title": "Aula Base",
        "status": "draft",
        "course_id": setup_course
    }
    res = client.post("/api/lessons/", json=payload, headers=owner_token)
    assert res.status_code in [200, 201], f"Erro ao criar AULA base: {res.text}"
    return res.json()["id"]