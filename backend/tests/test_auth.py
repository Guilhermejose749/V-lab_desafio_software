import uuid

def test_register_user_success(client):
    email = f"novo_{uuid.uuid4()}@teste.com"
    payload = {
        "name": "Novo Usuário",
        "email": email,
        "password": "password123"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code in [200, 201]
    assert response.json()["email"] == email

def test_register_user_duplicate_email(client):
    email = f"duplicado_{uuid.uuid4()}@teste.com"
    payload = {"name": "User 1", "email": email, "password": "senha123"}
    
    # Primeira tentativa (sucesso)
    client.post("/api/auth/register", json=payload)
    
    # Segunda tentativa com mesmo email (deve falhar)
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400

def test_login_success(client):
    email = f"login_{uuid.uuid4()}@teste.com"
    client.post("/api/auth/register", json={"name": "Logar", "email": email, "password": "senha123"})
    
    response = client.post("/api/auth/login", data={"username": email, "password": "senha123"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_wrong_password(client):
    email = f"wrong_{uuid.uuid4()}@teste.com"
    client.post("/api/auth/register", json={"name": "Logar", "email": email, "password": "senha123"})
    
    response = client.post("/api/auth/login", data={"username": email, "password": "senha_errada"})
    assert response.status_code in [400, 401]