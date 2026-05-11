def test_create_lesson_as_course_owner(client, owner_token, setup_course):
    payload = {
        "title": "Introdução ao Teste",
        "status": "published",
        "course_id": setup_course
    }
    response = client.post("/api/lessons/", json=payload, headers=owner_token)
    assert response.status_code in [200, 201]
    assert response.json()["title"] == "Introdução ao Teste"

def test_create_lesson_as_intruder(client, intruder_token, setup_course):
    payload = {
        "title": "Aula Falsa",
        "status": "draft",
        "course_id": setup_course
    }
    response = client.post("/api/lessons/", json=payload, headers=intruder_token)
    # Apenas o dono do curso pode adicionar aulas a ele
    assert response.status_code in [401, 403]

def test_edit_lesson_as_owner(client, owner_token, setup_lesson):
    payload = {"title": "Aula Base Editada", "status": "published"}
    response = client.patch(f"/api/lessons/{setup_lesson}", json=payload, headers=owner_token)
    assert response.status_code == 200
    assert response.json()["title"] == "Aula Base Editada"

def test_edit_lesson_as_intruder(client, intruder_token, setup_lesson):
    payload = {"title": "Tentativa de Edição"}
    response = client.patch(f"/api/lessons/{setup_lesson}", json=payload, headers=intruder_token)
    assert response.status_code in [401, 403]

def test_delete_lesson_as_intruder(client, intruder_token, setup_lesson):
    response = client.delete(f"/api/lessons/{setup_lesson}", headers=intruder_token)
    assert response.status_code in [401, 403]

def test_delete_lesson_as_owner(client, owner_token, setup_lesson):
    response = client.delete(f"/api/lessons/{setup_lesson}", headers=owner_token)
    assert response.status_code in [200, 204]
    
    # Validar se deletou buscando a aula
    get_response = client.get(f"/api/lessons/{setup_lesson}")
    assert get_response.status_code == 404