import json
import os
from contextlib import contextmanager
from pathlib import Path
from statistics import mean

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, ForeignKey, Integer, String, Table, Text, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker
from sqlalchemy.types import JSON


DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("POSTGRES_URL")
    or os.getenv("STORAGE_URL")
    or "sqlite:///./yoaprendo-dev.db"
)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


json_type = JSONB if DATABASE_URL.startswith("postgresql") else JSON


guardian_students = Table(
    "guardian_students",
    Base.metadata,
    Column("guardian_id", ForeignKey("guardians.id", ondelete="CASCADE"), primary_key=True),
    Column("student_id", ForeignKey("students.id", ondelete="CASCADE"), primary_key=True),
)


teacher_classrooms = Table(
    "teacher_classrooms",
    Base.metadata,
    Column("teacher_id", ForeignKey("teachers.id", ondelete="CASCADE"), primary_key=True),
    Column("classroom_id", ForeignKey("classrooms.id", ondelete="CASCADE"), primary_key=True),
)


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    teacher_name: Mapped[str] = mapped_column(String(120), default="")
    teacher_email: Mapped[str] = mapped_column(String(160), default="")
    notes: Mapped[str] = mapped_column(Text, default="")

    classrooms: Mapped[list["Classroom"]] = relationship(back_populates="institution")
    teachers: Mapped[list["Teacher"]] = relationship(back_populates="institution")


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), default="")
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)

    institution: Mapped[Institution] = relationship(back_populates="teachers")
    classrooms: Mapped[list["Classroom"]] = relationship(secondary=teacher_classrooms, back_populates="teachers")


class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    grade_label: Mapped[str] = mapped_column(String(80), nullable=False)
    group_code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    assigned_worlds: Mapped[list[str]] = mapped_column(json_type, default=list)

    institution: Mapped[Institution] = relationship(back_populates="classrooms")
    students: Mapped[list["Student"]] = relationship(back_populates="classroom")
    teachers: Mapped[list[Teacher]] = relationship(secondary=teacher_classrooms, back_populates="classrooms")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    classroom_id: Mapped[str] = mapped_column(ForeignKey("classrooms.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    avatar: Mapped[str] = mapped_column(String(80), default="")
    student_code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    energy: Mapped[int] = mapped_column(Integer, default=70)
    weekly_minutes: Mapped[int] = mapped_column(Integer, default=0)
    attendance: Mapped[str] = mapped_column(String(40), default="Nueva")
    completed_missions: Mapped[int] = mapped_column(Integer, default=0)
    total_missions: Mapped[int] = mapped_column(Integer, default=28)
    strong_concept: Mapped[str] = mapped_column(String(120), default="Inicio")
    needs_support: Mapped[str] = mapped_column(String(120), default="Exploracion inicial")
    autonomy: Mapped[str] = mapped_column(String(80), default="Acompanada")
    badges: Mapped[list[str]] = mapped_column(json_type, default=list)
    focus_tip: Mapped[str] = mapped_column(Text, default="")
    next_mission: Mapped[dict] = mapped_column(json_type, default=dict)
    concepts: Mapped[list[dict]] = mapped_column(json_type, default=list)
    teacher_message: Mapped[str] = mapped_column(Text, default="")

    classroom: Mapped[Classroom] = relationship(back_populates="students")
    guardians: Mapped[list["Guardian"]] = relationship(secondary=guardian_students, back_populates="students")


class Guardian(Base):
    __tablename__ = "guardians"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    contact: Mapped[str] = mapped_column(String(160), default="")

    students: Mapped[list[Student]] = relationship(secondary=guardian_students, back_populates="guardians")


class LoginRequest(BaseModel):
    role: str
    name: str = ""
    code: str = ""


class ClassroomCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    grade_label: str = Field(min_length=2, max_length=40)


class StudentCreateRequest(BaseModel):
    classroom_id: str
    name: str = Field(min_length=2, max_length=40)
    display_name: str = Field(default="")
    student_code: str = Field(default="")


class GuardianLinkRequest(BaseModel):
    student_id: str
    guardian_name: str = Field(min_length=2, max_length=60)
    guardian_code: str = Field(min_length=4, max_length=20)
    contact: str = Field(default="")


app = FastAPI(title="YoAprendo API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@contextmanager
def db_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def load_seed() -> dict:
    seed_path = Path(__file__).with_name("data.json")
    return json.loads(seed_path.read_text(encoding="utf-8"))


def seed_database(session: Session) -> None:
    if session.scalar(select(Institution.id).limit(1)):
        return

    seed = load_seed()

    institutions = {
        item["id"]: Institution(
            id=item["id"],
            name=item["name"],
            code=item["code"],
            teacher_name=item.get("teacher_name", ""),
            teacher_email=item.get("teacher_email", ""),
            notes=item.get("notes", ""),
        )
        for item in seed["institutions"].values()
    }
    session.add_all(institutions.values())

    classrooms = {
        item["id"]: Classroom(
            id=item["id"],
            institution_id=item["institution_id"],
            name=item["name"],
            grade_label=item["grade_label"],
            group_code=item["group_code"],
            assigned_worlds=item.get("assigned_worlds", []),
        )
        for item in seed["classrooms"].values()
    }
    session.add_all(classrooms.values())

    teachers = {
        item["id"]: Teacher(
            id=item["id"],
            institution_id=item["institution_id"],
            name=item["name"],
            email=item.get("email", ""),
            code=item["code"],
        )
        for item in seed.get("teachers", {}).values()
    }
    session.add_all(teachers.values())

    students = {
        item["id"]: Student(
            id=item["id"],
            classroom_id=item["classroom_id"],
            name=item["name"],
            display_name=item["display_name"],
            avatar=item.get("avatar", ""),
            student_code=item["student_code"],
            streak_days=item.get("streak_days", 0),
            energy=item.get("energy", 70),
            weekly_minutes=item.get("weekly_minutes", 0),
            attendance=item.get("attendance", "Nueva"),
            completed_missions=item.get("completed_missions", 0),
            total_missions=item.get("total_missions", 28),
            strong_concept=item.get("strong_concept", "Inicio"),
            needs_support=item.get("needs_support", "Exploracion inicial"),
            autonomy=item.get("autonomy", "Acompanada"),
            badges=item.get("badges", []),
            focus_tip=item.get("focus_tip", ""),
            next_mission=item.get("next_mission", {}),
            concepts=item.get("concepts", []),
            teacher_message=item.get("teacher_message", ""),
        )
        for item in seed["students"].values()
    }
    session.add_all(students.values())
    session.flush()

    for item in seed.get("teachers", {}).values():
        teacher = teachers[item["id"]]
        teacher.classrooms = [classrooms[classroom_id] for classroom_id in item.get("classroom_ids", [])]

    guardians = []
    for item in seed["guardians"].values():
        guardian = Guardian(
            id=item["id"],
            name=item["name"],
            code=item["code"],
            contact=item.get("contact", ""),
        )
        guardian.students = [students[student_id] for student_id in item.get("student_ids", [])]
        guardians.append(guardian)
    session.add_all(guardians)


@app.on_event("startup")
def init_database() -> None:
    Base.metadata.create_all(bind=engine)
    with db_session() as session:
        seed_database(session)


def slugify(value: str) -> str:
    clean = "".join(char.lower() if char.isalnum() else "-" for char in value)
    while "--" in clean:
        clean = clean.replace("--", "-")
    return clean.strip("-") or "item"


def unique_id(session: Session, model: type[Base], prefix: str, value: str) -> str:
    base = f"{prefix}-{slugify(value)}"
    candidate = base
    suffix = 1
    while session.get(model, candidate):
        suffix += 1
        candidate = f"{base}-{suffix}"
    return candidate


def get_classroom(session: Session, classroom_id: str) -> Classroom:
    classroom = session.get(Classroom, classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return classroom


def get_student(session: Session, student_id: str) -> Student:
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


def get_guardian(session: Session, guardian_id: str) -> Guardian:
    guardian = session.get(Guardian, guardian_id)
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")
    return guardian


def student_percent(student: Student) -> int:
    return round((student.completed_missions / student.total_missions) * 100) if student.total_missions else 0


def student_summary(student: Student) -> dict:
    return {
        "id": student.id,
        "name": student.name,
        "display_name": student.display_name,
        "grade_label": student.classroom.grade_label,
        "classroom_name": student.classroom.name,
        "student_code": student.student_code,
        "completed_missions": student.completed_missions,
        "total_missions": student.total_missions,
        "progress_percent": student_percent(student),
        "weekly_minutes": student.weekly_minutes,
        "strong_concept": student.strong_concept,
        "needs_support": student.needs_support,
        "attendance": student.attendance,
        "autonomy": student.autonomy,
    }


def classroom_summary(classroom: Classroom) -> dict:
    students = classroom.students
    active_count = sum(1 for student in students if student.attendance == "Activa")
    avg_completion = round(mean(student_percent(student) for student in students)) if students else 0
    return {
        "id": classroom.id,
        "name": classroom.name,
        "grade_label": classroom.grade_label,
        "group_code": classroom.group_code,
        "student_count": len(students),
        "active_today": active_count,
        "avg_completion": avg_completion,
        "assigned_worlds": classroom.assigned_worlds,
    }


def institution_dashboard(session: Session, institution_id: str) -> dict:
    institution = session.get(Institution, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    classrooms = institution.classrooms
    students = [student for classroom in classrooms for student in classroom.students]
    guardians = session.scalars(select(Guardian)).all()

    concept_names = ["Secuencias", "Bucles", "Decisiones", "Datos y creacion"]
    concept_overview = []
    for concept_name in concept_names:
        values = [
            concept["percent"]
            for student in students
            for concept in student.concepts
            if concept["title"] == concept_name
        ]
        concept_overview.append({"title": concept_name, "percent": round(mean(values)) if values else 0})

    return {
        "institution": {
            "id": institution.id,
            "name": institution.name,
            "code": institution.code,
            "teacher_name": institution.teacher_name,
            "teacher_email": institution.teacher_email,
            "notes": institution.notes,
        },
        "teacher": {
            "name": institution.teacher_name,
            "email": institution.teacher_email,
        },
        "summary": {
            "classroom_count": len(classrooms),
            "student_count": len(students),
            "active_today": sum(1 for student in students if student.attendance == "Activa"),
            "linked_guardians": sum(1 for guardian in guardians if guardian.students),
            "avg_weekly_minutes": round(mean(student.weekly_minutes for student in students)) if students else 0,
            "avg_completion": round(mean(student_percent(student) for student in students)) if students else 0,
        },
        "classrooms": [classroom_summary(classroom) for classroom in classrooms],
        "students": [student_summary(student) for student in students],
        "guardians": [guardian_payload(guardian) for guardian in guardians],
        "concept_overview": concept_overview,
        "alerts": [
            {
                "student_name": student.name,
                "reason": student.needs_support,
                "attendance": student.attendance,
                "teacher_message": student.teacher_message,
            }
            for student in students
            if student.attendance in {"Acompanar", "Inactiva"}
        ],
        "available_students": [
            {"id": student.id, "name": student.name, "classroom_name": student.classroom.name}
            for student in students
        ],
    }


def teacher_dashboard(session: Session, teacher_id: str) -> dict:
    teacher = session.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    classrooms = teacher.classrooms
    students = [student for classroom in classrooms for student in classroom.students]
    return {
        "teacher": {
            "id": teacher.id,
            "institution_id": teacher.institution_id,
            "name": teacher.name,
            "email": teacher.email,
            "code": teacher.code,
            "classroom_ids": [classroom.id for classroom in classrooms],
        },
        "institution": {
            "id": teacher.institution.id,
            "name": teacher.institution.name,
        },
        "summary": {
            "classroom_count": len(classrooms),
            "student_count": len(students),
            "active_today": sum(1 for student in students if student.attendance == "Activa"),
            "avg_completion": round(mean(student_percent(student) for student in students)) if students else 0,
        },
        "classrooms": [classroom_summary(classroom) for classroom in classrooms],
        "students": [student_summary(student) for student in students],
        "alerts": [
            {
                "student_name": student.name,
                "reason": student.needs_support,
                "attendance": student.attendance,
                "teacher_message": student.teacher_message,
            }
            for student in students
            if student.attendance != "Activa"
        ],
        "available_students": [
            {"id": student.id, "name": student.name, "classroom_name": student.classroom.name}
            for student in students
        ],
    }


def guardian_payload(guardian: Guardian) -> dict:
    return {
        "id": guardian.id,
        "name": guardian.name,
        "code": guardian.code,
        "student_ids": [student.id for student in guardian.students],
        "contact": guardian.contact,
    }


def guardian_dashboard(session: Session, guardian_id: str) -> dict:
    guardian = get_guardian(session, guardian_id)
    children = guardian.students
    child_summaries = [student_summary(student) for student in children]
    selected_student = children[0] if children else None

    return {
        "guardian": guardian_payload(guardian),
        "summary": {
            "children_count": len(children),
            "weekly_minutes": sum(student.weekly_minutes for student in children),
            "strongest": selected_student.strong_concept if selected_student else "Exploracion inicial",
            "needs_support": selected_student.needs_support if selected_student else "Sin datos",
        },
        "children": child_summaries,
        "selected_child": {
            "student": child_summaries[0] if child_summaries else None,
            "teacher_message": selected_student.teacher_message if selected_student else "",
            "home_actions": [
                "Pedirle que explique en voz alta como llegaria un personaje a una meta.",
                "Jugar a ordenar pasos cotidianos antes de empezar una tarea.",
                "Celebrar el intento correcto aunque todavia necesite ayuda.",
            ],
            "observations": [
                "Se engancha mejor cuando la consigna parece una mision.",
                "Conviene acompanar con preguntas cortas en vez de resolver por el nino.",
            ],
        },
    }


def student_dashboard(session: Session, student_id: str) -> dict:
    student = get_student(session, student_id)
    return {
        "student": student_summary(student),
        "badges": student.badges,
        "energy": student.energy,
        "streak_days": student.streak_days,
        "focus_tip": student.focus_tip,
        "teacher_message": student.teacher_message,
        "next_mission": student.next_mission,
        "concepts": student.concepts,
    }


def resolve_login(session: Session, payload: LoginRequest) -> dict:
    role = payload.role.lower()
    code = payload.code.strip().lower()
    name = payload.name.strip().lower()

    if role == "student":
        student = session.scalars(select(Student)).all()
        match = next((item for item in student if item.student_code.lower() == code or item.name.lower() == name), None)
        if not match:
            raise HTTPException(status_code=404, detail="Student access not found")
        return {
            "role": "student",
            "display_name": match.display_name,
            "entity_id": match.id,
            "redirect_view": "world-map",
            "context": {"classroom_name": match.classroom.name, "grade_label": match.classroom.grade_label},
        }

    if role == "parent":
        guardians = session.scalars(select(Guardian)).all()
        match = next((item for item in guardians if item.code.lower() == code or item.name.lower() == name), None)
        if not match:
            raise HTTPException(status_code=404, detail="Guardian access not found")
        return {
            "role": "parent",
            "display_name": match.name,
            "entity_id": match.id,
            "redirect_view": "dashboard",
            "context": {"children_count": len(match.students)},
        }

    if role == "institution":
        institutions = session.scalars(select(Institution)).all()
        match = next((item for item in institutions if item.code.lower() == code or item.name.lower() == name), None)
        if not match:
            raise HTTPException(status_code=404, detail="Institution access not found")
        return {
            "role": "institution",
            "display_name": match.name,
            "entity_id": match.id,
            "redirect_view": "dashboard",
            "context": {"teacher_name": match.teacher_name},
        }

    if role == "teacher":
        teachers = session.scalars(select(Teacher)).all()
        match = next((item for item in teachers if item.code.lower() == code or item.name.lower() == name), None)
        if not match:
            raise HTTPException(status_code=404, detail="Teacher access not found")
        return {
            "role": "teacher",
            "display_name": match.name,
            "entity_id": match.id,
            "redirect_view": "dashboard",
            "context": {"institution_name": match.institution.name},
        }

    raise HTTPException(status_code=400, detail="Unsupported role")


@app.get("/api/health")
def health():
    with db_session() as session:
        institution_count = session.query(Institution).count()
    return {"ok": True, "database": "connected", "institutions": institution_count}


@app.get("/api/access/demo")
def access_demo():
    return {
        "student": {"name": "Sofi", "code": "Nivel 4"},
        "parent": {"name": "Familia de Sofi", "code": "FAM-404"},
        "teacher": {"name": "Profe Lucia", "code": "DOC-4A"},
        "institution": {"name": "Escuela Demo Uruguay", "code": "INST-4A"},
    }


@app.post("/api/access/login")
def access_login(payload: LoginRequest):
    with db_session() as session:
        return resolve_login(session, payload)


@app.get("/api/dashboard/student/{student_id}")
def get_student_dashboard(student_id: str):
    with db_session() as session:
        return student_dashboard(session, student_id)


@app.get("/api/dashboard/parent/{guardian_id}")
def get_parent_dashboard(guardian_id: str):
    with db_session() as session:
        return guardian_dashboard(session, guardian_id)


@app.get("/api/dashboard/institution/{institution_id}")
def get_institution_dashboard(institution_id: str):
    with db_session() as session:
        return institution_dashboard(session, institution_id)


@app.get("/api/dashboard/teacher/{teacher_id}")
def get_teacher_dashboard(teacher_id: str):
    with db_session() as session:
        return teacher_dashboard(session, teacher_id)


@app.post("/api/institutions/{institution_id}/classrooms")
def create_classroom(institution_id: str, payload: ClassroomCreateRequest):
    with db_session() as session:
        institution = session.get(Institution, institution_id)
        if not institution:
            raise HTTPException(status_code=404, detail="Institution not found")

        classroom = Classroom(
            id=unique_id(session, Classroom, "class", payload.name),
            institution_id=institution_id,
            name=payload.name.strip(),
            grade_label=payload.grade_label.strip(),
            group_code=f"AULA-{payload.name.upper().replace(' ', '')[:12]}",
            assigned_worlds=["Secuencias"],
        )
        session.add(classroom)
        session.flush()
        return {"ok": True, "classroom": classroom_summary(classroom)}


@app.post("/api/classrooms/{classroom_id}/students")
def create_student(classroom_id: str, payload: StudentCreateRequest):
    with db_session() as session:
        classroom = get_classroom(session, classroom_id)
        student_name = payload.name.strip()
        student = Student(
            id=unique_id(session, Student, "stu", student_name),
            classroom_id=classroom.id,
            name=student_name,
            display_name=payload.display_name.strip() or student_name,
            avatar="Nuevo tripulante",
            student_code=payload.student_code.strip() or f"{student_name[:3].upper()}-{classroom.name.replace(' ', '')}",
            streak_days=0,
            energy=70,
            weekly_minutes=0,
            attendance="Nueva",
            completed_missions=0,
            total_missions=28,
            strong_concept="Inicio",
            needs_support="Exploracion inicial",
            autonomy="Acompanada",
            badges=["Nuevo ingreso"],
            focus_tip="Conviene empezar por secuencias con una mision breve.",
            next_mission={"world": "Isla de las Secuencias", "title": "Primeros pasos", "number": 1},
            concepts=[
                {"title": "Secuencias", "completed": 0, "total": 7, "percent": 0},
                {"title": "Bucles", "completed": 0, "total": 7, "percent": 0},
                {"title": "Decisiones", "completed": 0, "total": 7, "percent": 0},
                {"title": "Datos y creacion", "completed": 0, "total": 7, "percent": 0},
            ],
            teacher_message="Nuevo alumno. Conviene acompanar el primer acceso.",
        )
        session.add(student)
        session.flush()
        return {"ok": True, "student": student_summary(student)}


@app.post("/api/students/{student_id}/guardians")
def link_guardian(student_id: str, payload: GuardianLinkRequest):
    with db_session() as session:
        student = get_student(session, student_id)
        guardian_code = payload.guardian_code.strip()
        guardians = session.scalars(select(Guardian)).all()
        guardian = next((item for item in guardians if item.code.lower() == guardian_code.lower()), None)

        if guardian is None:
            guardian_name = payload.guardian_name.strip()
            guardian = Guardian(
                id=unique_id(session, Guardian, "guardian", guardian_name),
                name=guardian_name,
                code=guardian_code,
                contact=payload.contact.strip(),
            )
            session.add(guardian)

        if student not in guardian.students:
            guardian.students.append(student)

        session.flush()
        return {"ok": True, "guardian": guardian_payload(guardian)}
