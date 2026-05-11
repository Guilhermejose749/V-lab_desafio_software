import random
from datetime import date, timedelta
from sqlmodel import Session, select
from app.db.database import engine, create_db_and_tables
from app.models.user import User
from app.models.course import Course
from app.models.lesson import Lesson
from app.core.security import get_password_hash

def seed_db():
    # Cria as tabelas caso elas ainda não existam
    create_db_and_tables()
    
    easter_egg_url = "https://youtu.be/QDia3e12czc?si=_ADP5FxVcE8MVMJj"
    default_url = "https://www.youtube.com"
    statuses = ["draft", "published"]

    print("Iniciando a semeadura (Seed) do banco de dados...")

    # No SQLModel, usamos Session(engine) direto
    with Session(engine) as db:
        try:
            # Criar 10 usuários (teste1 a teste10)
            for i in range(1, 11):
                email = f"teste{i}@teste.com"
                username = f"teste{i}"
                password = f"teste{i}password"

                # Checa se usuário já existe usando a sintaxe do SQLModel
                user = db.exec(select(User).where(User.email == email)).first()
                if not user:
                    user = User(
                        name=username,
                        email=email,
                        hashed_password=get_password_hash(password)
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    print(f"👤 Usuário {user.name} criado.")

                # Gerar de 0 a 5 cursos para este usuário
                num_courses = random.randint(0, 5)
                
                for j in range(1, num_courses + 1):
                    course_name = f"teste{j}"
                    
                    course = db.exec(select(Course).where(
                        Course.name == course_name, 
                        Course.creator_id == user.id
                    )).first()
                    
                    if not course:
                        start_date = date(2026, random.randint(1, 6), random.randint(1, 28))
                        end_date = start_date + timedelta(days=random.randint(180, 365))

                        course = Course(
                            name=course_name,
                            description=f"teste{j}descricao",
                            start_date=start_date,
                            end_date=end_date,
                            creator_id=user.id
                        )
                        db.add(course)
                        db.commit()
                        db.refresh(course)

                        # Gerar de 1 a 3 aulas para este curso
                        num_lessons = random.randint(1, 3)
                        
                        for k in range(1, num_lessons + 1):
                            lesson_title = f"teste{k}"
                            
                            lesson = db.exec(select(Lesson).where(
                                Lesson.title == lesson_title,
                                Lesson.course_id == course.id
                            )).first()

                            if not lesson:
                                url_choice = random.choice([None, default_url, easter_egg_url])
                                status_choice = random.choice(statuses)

                                lesson = Lesson(
                                    title=lesson_title,
                                    status=status_choice,
                                    video_url=url_choice,
                                    course_id=course.id
                                )
                                db.add(lesson)
                        
                        db.commit()

            print("✅ Banco de dados populado com sucesso!")
            
        except Exception as e:
            print(f"❌ Erro ao popular o banco: {e}")
            db.rollback()

if __name__ == "__main__":
    seed_db()