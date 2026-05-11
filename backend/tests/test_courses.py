def test_create_course_success(client, owner_token):
    payload = {
        "name": "Curso de Python",
        "description": "Backend com FastAPI",
        "start_date": "2026-08-01",
        "end_date": "2026-08-30"
    }
    response = client.post("/api/courses/", json=payload, headers=owner_token)
    assert response.status_code in [200, 201]
    assert response.json()["name"] == "Curso de Python"

def test_create_course_unauthorized(client):
    payload = {
        "name": "Curso Fantasma",
        "start_date": "2026-08-01",
        "end_date": "2026-08-30"
    }
    response = client.post("/api/courses/", json=payload)
    # Requer token de autenticação
    assert response.status_code == 401 

def test_edit_course_as_owner(client, owner_token, setup_course):
    payload = {"name": "Curso Base Editado"}
    response = client.patch(f"/api/courses/{setup_course}", json=payload, headers=owner_token)
    assert response.status_code == 200
    assert response.json()["name"] == "Curso Base Editado"

def test_edit_course_as_intruder(client, intruder_token, setup_course):
    payload = {"name": "Hackeando o Curso"}
    response = client.patch(f"/api/courses/{setup_course}", json=payload, headers=intruder_token)
    # Intruso não tem permissão
    assert response.status_code in [401, 403] 

def test_delete_course_as_intruder(client, intruder_token, setup_course):
    response = client.delete(f"/api/courses/{setup_course}", headers=intruder_token)
    # Intruso não tem permissão para deletar
    assert response.status_code in [401, 403]

def test_delete_course_as_owner(client, owner_token, setup_course):
    # Dono tem permissão para deletar
    response = client.delete(f"/api/courses/{setup_course}", headers=owner_token)
    assert response.status_code in [200, 204]
    
    # Verifica se realmente sumiu 
    get_response = client.get(f"/api/courses/{setup_course}", headers=owner_token)
    assert get_response.status_code == 404