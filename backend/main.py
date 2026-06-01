from copy import deepcopy
from statistics import mean

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="YoAprendo API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SEED = {
    "institutions": {
        "inst-uy": {
            "id": "inst-uy",
            "name": "Escuela Demo Uruguay",
            "code": "INST-4A",
            "teacher_name": "Profe Lucia",
            "teacher_email": "lucia@yoaprendo.demo",
            "notes": "Centro piloto para pensamiento computacional."
        }
    },
    "classrooms": {
        "class-4a": {
            "id": "class-4a",
            "institution_id": "inst-uy",
            "name": "4.o A",
            "grade_label": "4.o de escuela",
            "group_code": "AULA-4A",
            "student_ids": ["stu-sofi", "stu-mateo", "stu-emma", "stu-benja"],
            "assigned_worlds": ["Secuencias", "Bucles", "Decisiones"],
        },
        "class-4b": {
            "id": "class-4b",
            "institution_id": "inst-uy",
            "name": "4.o B",
            "grade_label": "4.o de escuela",
            "group_code": "AULA-4B",
            "student_ids": ["stu-mila", "stu-valen"],
            "assigned_worlds": ["Secuencias", "Datos y creacion"],
        },
    },
    "students": {
        "stu-sofi": {
            "id": "stu-sofi",
            "name": "Sofi",
            "display_name": "Sofi",
            "avatar": "Exploradora",
            "classroom_id": "class-4a",
            "student_code": "Nivel 4",
            "streak_days": 3,
            "energy": 82,
            "weekly_minutes": 42,
            "attendance": "Activa",
            "completed_missions": 8,
            "total_missions": 28,
            "strong_concept": "Secuencias",
            "needs_support": "Bucles",
            "autonomy": "En crecimiento",
            "badges": ["Exploradora curiosa", "Ordena secuencias", "Primer faro desbloqueado"],
            "focus_tip": "Hoy conviene seguir con una mision corta y sumar otra estrella.",
            "next_mission": {"world": "Isla de los Bucles", "title": "Repite el camino", "number": 8},
            "concepts": [
                {"title": "Secuencias", "completed": 6, "total": 7, "percent": 86},
                {"title": "Bucles", "completed": 1, "total": 7, "percent": 14},
                {"title": "Decisiones", "completed": 1, "total": 7, "percent": 14},
                {"title": "Datos y creacion", "completed": 0, "total": 7, "percent": 0},
            ],
            "teacher_message": "Le responde muy bien a desafios cortos y visuales.",
        },
        "stu-mateo": {
            "id": "stu-mateo",
            "name": "Mateo",
            "display_name": "Mateo",
            "avatar": "Capitan",
            "classroom_id": "class-4a",
            "student_code": "MAT-4A",
            "streak_days": 5,
            "energy": 88,
            "weekly_minutes": 68,
            "attendance": "Activa",
            "completed_missions": 11,
            "total_missions": 28,
            "strong_concept": "Bucles",
            "needs_support": "Decisiones",
            "autonomy": "Alta",
            "badges": ["Capitan del ritmo", "Encuentra patrones"],
            "focus_tip": "Puede sostener un desafio un poco mas largo.",
            "next_mission": {"world": "Isla de las Decisiones", "title": "Puertas con reglas", "number": 12},
            "concepts": [
                {"title": "Secuencias", "completed": 5, "total": 7, "percent": 71},
                {"title": "Bucles", "completed": 4, "total": 7, "percent": 57},
                {"title": "Decisiones", "completed": 2, "total": 7, "percent": 29},
                {"title": "Datos y creacion", "completed": 0, "total": 7, "percent": 0},
            ],
            "teacher_message": "Buen avance; necesita verbalizar mas por que elige una condicion.",
        },
        "stu-emma": {
            "id": "stu-emma",
            "name": "Emma",
            "display_name": "Emma",
            "avatar": "Navegante",
            "classroom_id": "class-4a",
            "student_code": "EMM-4A",
            "streak_days": 2,
            "energy": 74,
            "weekly_minutes": 51,
            "attendance": "Activa",
            "completed_missions": 9,
            "total_missions": 28,
            "strong_concept": "Secuencias",
            "needs_support": "Datos y creacion",
            "autonomy": "Media",
            "badges": ["Ruta segura"],
            "focus_tip": "Le sirve repetir una mision con una regla nueva.",
            "next_mission": {"world": "Isla de las Decisiones", "title": "Si pasa, entonces", "number": 10},
            "concepts": [
                {"title": "Secuencias", "completed": 5, "total": 7, "percent": 71},
                {"title": "Bucles", "completed": 2, "total": 7, "percent": 29},
                {"title": "Decisiones", "completed": 2, "total": 7, "percent": 29},
                {"title": "Datos y creacion", "completed": 0, "total": 7, "percent": 0},
            ],
            "teacher_message": "Participa mejor cuando puede explicar la solucion con dibujos.",
        },
        "stu-benja": {
            "id": "stu-benja",
            "name": "Benja",
            "display_name": "Benja",
            "avatar": "Explorador",
            "classroom_id": "class-4a",
            "student_code": "BEN-4A",
            "streak_days": 1,
            "energy": 53,
            "weekly_minutes": 12,
            "attendance": "Acompanar",
            "completed_missions": 2,
            "total_missions": 28,
            "strong_concept": "Exploracion inicial",
            "needs_support": "Constancia",
            "autonomy": "Baja",
            "badges": ["Primer desembarco"],
            "focus_tip": "Necesita consignas cortas y mucho feedback de logro rapido.",
            "next_mission": {"world": "Isla de las Secuencias", "title": "Ordena los pasos", "number": 3},
            "concepts": [
                {"title": "Secuencias", "completed": 2, "total": 7, "percent": 29},
                {"title": "Bucles", "completed": 0, "total": 7, "percent": 0},
                {"title": "Decisiones", "completed": 0, "total": 7, "percent": 0},
                {"title": "Datos y creacion", "completed": 0, "total": 7, "percent": 0},
            ],
            "teacher_message": "Conviene acompanar el ingreso y asegurar una mision ganable por sesion.",
        },
        "stu-mila": {
            "id": "stu-mila",
            "name": "Mila",
            "display_name": "Mila",
            "avatar": "Brillante",
            "classroom_id": "class-4b",
            "student_code": "MIL-4B",
            "streak_days": 6,
            "energy": 90,
            "weekly_minutes": 74,
            "attendance": "Activa",
            "completed_missions": 13,
            "total_missions": 28,
            "strong_concept": "Decisiones",
            "needs_support": "Datos y creacion",
            "autonomy": "Alta",
            "badges": ["Resuelve retos", "Abre caminos"],
            "focus_tip": "Puede pasar a consignas de creacion y comparacion.",
            "next_mission": {"world": "Isla de Datos", "title": "Agrupa y crea", "number": 15},
            "concepts": [
                {"title": "Secuencias", "completed": 5, "total": 7, "percent": 71},
                {"title": "Bucles", "completed": 3, "total": 7, "percent": 43},
                {"title": "Decisiones", "completed": 5, "total": 7, "percent": 71},
                {"title": "Datos y creacion", "completed": 0, "total": 7, "percent": 0},
            ],
            "teacher_message": "Muy buena autonomia. Lista para mas exploracion guiada.",
        },
        "stu-valen": {
            "id": "stu-valen",
            "name": "Valen",
            "display_name": "Valen",
            "avatar": "Aventurero",
            "classroom_id": "class-4b",
            "student_code": "VAL-4B",
            "streak_days": 2,
            "energy": 67,
            "weekly_minutes": 28,
            "attendance": "Inactiva",
            "completed_missions": 4,
            "total_missions": 28,
            "strong_concept": "Secuencias",
            "needs_support": "Bucles",
            "autonomy": "Media",
            "badges": ["Primer mapa"],
            "focus_tip": "Necesita volver al ritmo de ingreso semanal.",
            "next_mission": {"world": "Isla de los Bucles", "title": "Atajo repetido", "number": 8},
            "concepts": [
                {"title": "Secuencias", "completed": 4, "total": 7, "percent": 57},
                {"title": "Bucles", "completed": 0, "total": 7, "percent": 0},
                {"title": "Decisiones", "completed": 0, "total": 7, "percent": 0},
                {"title": "Datos y creacion", "completed": 0, "total": 7, "percent": 0},
            ],
            "teacher_message": "Necesita una reentrada suave con objetivos muy cortos.",
        },
    },
    "guardians": {
        "guardian-sofi": {
            "id": "guardian-sofi",
            "name": "Familia de Sofi",
            "code": "FAM-404",
            "student_ids": ["stu-sofi"],
            "contact": "familia.sofi@yoaprendo.demo",
        }
    },
}


db = deepcopy(SEED)


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


def slugify(value: str) -> str:
    clean = "".join(char.lower() if char.isalnum() else "-" for char in value)
    while "--" in clean:
        clean = clean.replace("--", "-")
    return clean.strip("-") or "item"


def get_classroom(classroom_id: str) -> dict:
    classroom = db["classrooms"].get(classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return classroom


def get_student(student_id: str) -> dict:
    student = db["students"].get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


def get_guardian(guardian_id: str) -> dict:
    guardian = db["guardians"].get(guardian_id)
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")
    return guardian


def student_summary(student: dict) -> dict:
    classroom = get_classroom(student["classroom_id"])
    percent = round((student["completed_missions"] / student["total_missions"]) * 100)
    return {
        "id": student["id"],
        "name": student["name"],
        "display_name": student["display_name"],
        "grade_label": classroom["grade_label"],
        "classroom_name": classroom["name"],
        "student_code": student["student_code"],
        "completed_missions": student["completed_missions"],
        "total_missions": student["total_missions"],
        "progress_percent": percent,
        "weekly_minutes": student["weekly_minutes"],
        "strong_concept": student["strong_concept"],
        "needs_support": student["needs_support"],
        "attendance": student["attendance"],
        "autonomy": student["autonomy"],
    }


def classroom_summary(classroom: dict) -> dict:
    students = [get_student(student_id) for student_id in classroom["student_ids"]]
    active_count = sum(1 for student in students if student["attendance"] == "Activa")
    avg_completion = round(
        mean(
            round((student["completed_missions"] / student["total_missions"]) * 100)
            for student in students
        )
    ) if students else 0
    return {
        "id": classroom["id"],
        "name": classroom["name"],
        "grade_label": classroom["grade_label"],
        "group_code": classroom["group_code"],
        "student_count": len(students),
        "active_today": active_count,
        "avg_completion": avg_completion,
        "assigned_worlds": classroom["assigned_worlds"],
    }


def institution_dashboard(institution_id: str) -> dict:
    institution = db["institutions"].get(institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    classrooms = [
        classroom
        for classroom in db["classrooms"].values()
        if classroom["institution_id"] == institution_id
    ]
    students = [
        get_student(student_id)
        for classroom in classrooms
        for student_id in classroom["student_ids"]
    ]
    guardians = list(db["guardians"].values())

    active_today = sum(1 for student in students if student["attendance"] == "Activa")
    total_students = len(students)
    linked_guardians = sum(1 for guardian in guardians if guardian["student_ids"])
    avg_weekly_minutes = round(mean(student["weekly_minutes"] for student in students)) if students else 0
    avg_completion = round(
        mean(round((student["completed_missions"] / student["total_missions"]) * 100) for student in students)
    ) if students else 0

    concept_names = ["Secuencias", "Bucles", "Decisiones", "Datos y creacion"]
    concept_overview = []
    for concept_name in concept_names:
        values = []
        for student in students:
            values.extend(
                concept["percent"]
                for concept in student["concepts"]
                if concept["title"] == concept_name
            )
        concept_overview.append(
            {
                "title": concept_name,
                "percent": round(mean(values)) if values else 0,
            }
        )

    alerts = []
    for student in students:
        if student["attendance"] == "Acompanar" or student["attendance"] == "Inactiva":
            alerts.append(
                {
                    "student_name": student["name"],
                    "reason": student["needs_support"],
                    "attendance": student["attendance"],
                    "teacher_message": student["teacher_message"],
                }
            )

    return {
        "institution": institution,
        "teacher": {
            "name": institution["teacher_name"],
            "email": institution["teacher_email"],
        },
        "summary": {
            "classroom_count": len(classrooms),
            "student_count": total_students,
            "active_today": active_today,
            "linked_guardians": linked_guardians,
            "avg_weekly_minutes": avg_weekly_minutes,
            "avg_completion": avg_completion,
        },
        "classrooms": [classroom_summary(classroom) for classroom in classrooms],
        "students": [student_summary(student) for student in students],
        "guardians": guardians,
        "concept_overview": concept_overview,
        "alerts": alerts,
        "available_students": [
            {"id": student["id"], "name": student["name"], "classroom_name": get_classroom(student["classroom_id"])["name"]}
            for student in students
        ],
    }


def guardian_dashboard(guardian_id: str) -> dict:
    guardian = get_guardian(guardian_id)
    children = [get_student(student_id) for student_id in guardian["student_ids"]]
    child_summaries = [student_summary(student) for student in children]
    selected = child_summaries[0] if child_summaries else None
    selected_student = children[0] if children else None
    strongest = selected_student["strong_concept"] if selected_student else "Exploracion inicial"
    weakest = selected_student["needs_support"] if selected_student else "Sin datos"

    return {
        "guardian": guardian,
        "summary": {
            "children_count": len(children),
            "weekly_minutes": sum(student["weekly_minutes"] for student in children),
            "strongest": strongest,
            "needs_support": weakest,
        },
        "children": child_summaries,
        "selected_child": {
            "student": selected,
            "teacher_message": selected_student["teacher_message"] if selected_student else "",
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


def student_dashboard(student_id: str) -> dict:
    student = get_student(student_id)
    summary = student_summary(student)
    return {
        "student": summary,
        "badges": student["badges"],
        "energy": student["energy"],
        "streak_days": student["streak_days"],
        "focus_tip": student["focus_tip"],
        "teacher_message": student["teacher_message"],
        "next_mission": student["next_mission"],
        "concepts": student["concepts"],
    }


def resolve_login(payload: LoginRequest) -> dict:
    role = payload.role.lower()
    code = payload.code.strip().lower()
    name = payload.name.strip().lower()

    if role == "student":
        for student in db["students"].values():
            if student["student_code"].lower() == code or student["name"].lower() == name:
                classroom = get_classroom(student["classroom_id"])
                return {
                    "role": "student",
                    "display_name": student["display_name"],
                    "entity_id": student["id"],
                    "redirect_view": "world-map",
                    "context": {
                        "classroom_name": classroom["name"],
                        "grade_label": classroom["grade_label"],
                    },
                }
        raise HTTPException(status_code=404, detail="Student access not found")

    if role == "parent":
        for guardian in db["guardians"].values():
            if guardian["code"].lower() == code or guardian["name"].lower() == name:
                return {
                    "role": "parent",
                    "display_name": guardian["name"],
                    "entity_id": guardian["id"],
                    "redirect_view": "dashboard",
                    "context": {"children_count": len(guardian["student_ids"])},
                }
        raise HTTPException(status_code=404, detail="Guardian access not found")

    if role == "institution":
        for institution in db["institutions"].values():
            if institution["code"].lower() == code or institution["name"].lower() == name:
                return {
                    "role": "institution",
                    "display_name": institution["name"],
                    "entity_id": institution["id"],
                    "redirect_view": "dashboard",
                    "context": {"teacher_name": institution["teacher_name"]},
                }
        raise HTTPException(status_code=404, detail="Institution access not found")

    raise HTTPException(status_code=400, detail="Unsupported role")


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/access/demo")
def access_demo():
    return {
        "student": {"name": "Sofi", "code": "Nivel 4"},
        "parent": {"name": "Familia de Sofi", "code": "FAM-404"},
        "institution": {"name": "Escuela Demo Uruguay", "code": "INST-4A"},
    }


@app.post("/api/access/login")
def access_login(payload: LoginRequest):
    return resolve_login(payload)


@app.get("/api/dashboard/student/{student_id}")
def get_student_dashboard(student_id: str):
    return student_dashboard(student_id)


@app.get("/api/dashboard/parent/{guardian_id}")
def get_parent_dashboard(guardian_id: str):
    return guardian_dashboard(guardian_id)


@app.get("/api/dashboard/institution/{institution_id}")
def get_institution_dashboard(institution_id: str):
    return institution_dashboard(institution_id)


@app.post("/api/institutions/{institution_id}/classrooms")
def create_classroom(institution_id: str, payload: ClassroomCreateRequest):
    if institution_id not in db["institutions"]:
        raise HTTPException(status_code=404, detail="Institution not found")

    classroom_id = f"class-{slugify(payload.name)}"
    suffix = 1
    while classroom_id in db["classrooms"]:
        suffix += 1
        classroom_id = f"class-{slugify(payload.name)}-{suffix}"

    group_suffix = payload.name.upper().replace(" ", "")[:6]
    db["classrooms"][classroom_id] = {
        "id": classroom_id,
        "institution_id": institution_id,
        "name": payload.name,
        "grade_label": payload.grade_label,
        "group_code": f"AULA-{group_suffix}",
        "student_ids": [],
        "assigned_worlds": ["Secuencias"],
    }
    return {"ok": True, "classroom": classroom_summary(db["classrooms"][classroom_id])}


@app.post("/api/classrooms/{classroom_id}/students")
def create_student(classroom_id: str, payload: StudentCreateRequest):
    classroom = get_classroom(classroom_id)
    student_name = payload.name.strip()
    base_slug = slugify(student_name)
    student_id = f"stu-{base_slug}"
    suffix = 1
    while student_id in db["students"]:
        suffix += 1
        student_id = f"stu-{base_slug}-{suffix}"

    code = payload.student_code.strip() or f"{student_name[:3].upper()}-{classroom['name'].replace(' ', '')}"
    display_name = payload.display_name.strip() or student_name

    db["students"][student_id] = {
        "id": student_id,
        "name": student_name,
        "display_name": display_name,
        "avatar": "Nuevo tripulante",
        "classroom_id": classroom_id,
        "student_code": code,
        "streak_days": 0,
        "energy": 70,
        "weekly_minutes": 0,
        "attendance": "Nueva",
        "completed_missions": 0,
        "total_missions": 28,
        "strong_concept": "Inicio",
        "needs_support": "Exploracion inicial",
        "autonomy": "Acompanada",
        "badges": ["Nuevo ingreso"],
        "focus_tip": "Conviene empezar por secuencias con una mision breve.",
        "next_mission": {"world": "Isla de las Secuencias", "title": "Primeros pasos", "number": 1},
        "concepts": [
            {"title": "Secuencias", "completed": 0, "total": 7, "percent": 0},
            {"title": "Bucles", "completed": 0, "total": 7, "percent": 0},
            {"title": "Decisiones", "completed": 0, "total": 7, "percent": 0},
            {"title": "Datos y creacion", "completed": 0, "total": 7, "percent": 0},
        ],
        "teacher_message": "Nuevo alumno. Conviene acompanar el primer acceso.",
    }
    classroom["student_ids"].append(student_id)
    return {"ok": True, "student": student_summary(db["students"][student_id])}


@app.post("/api/students/{student_id}/guardians")
def link_guardian(student_id: str, payload: GuardianLinkRequest):
    get_student(student_id)

    guardian_name = payload.guardian_name.strip()
    guardian_code = payload.guardian_code.strip()

    existing = next(
        (
            guardian
            for guardian in db["guardians"].values()
            if guardian["code"].lower() == guardian_code.lower()
        ),
        None,
    )

    if existing:
        if student_id not in existing["student_ids"]:
            existing["student_ids"].append(student_id)
        guardian = existing
    else:
        guardian_id = f"guardian-{slugify(guardian_name)}"
        suffix = 1
        while guardian_id in db["guardians"]:
            suffix += 1
            guardian_id = f"guardian-{slugify(guardian_name)}-{suffix}"
        guardian = {
            "id": guardian_id,
            "name": guardian_name,
            "code": guardian_code,
            "student_ids": [student_id],
            "contact": payload.contact.strip(),
        }
        db["guardians"][guardian_id] = guardian

    return {"ok": True, "guardian": guardian}
