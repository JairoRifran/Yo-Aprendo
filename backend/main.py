import json
import os
import base64
import hashlib
import hmac
import secrets
import time
import urllib.error
import urllib.request
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from statistics import mean
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table, Text, create_engine, delete, select
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
    subscription: Mapped["InstitutionSubscription"] = relationship(back_populates="institution", uselist=False)
    users: Mapped[list["InstitutionUser"]] = relationship(back_populates="institution")


class InstitutionSubscription(Base):
    __tablename__ = "institution_subscriptions"

    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="CASCADE"), primary_key=True)
    plan_key: Mapped[str] = mapped_column(String(40), default="trial")
    status: Mapped[str] = mapped_column(String(40), default="trialing", index=True)
    student_limit: Mapped[int] = mapped_column(Integer, default=50)
    teacher_limit: Mapped[int] = mapped_column(Integer, default=2)
    billing_email: Mapped[str] = mapped_column(String(160), default="")
    billing_provider: Mapped[str] = mapped_column(String(80), default="manual")
    billing_customer_id: Mapped[str] = mapped_column(String(160), default="")
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    institution: Mapped[Institution] = relationship(back_populates="subscription")


class BillingPayment(Base):
    __tablename__ = "billing_payments"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    institution_id: Mapped[str] = mapped_column(
        ForeignKey("institutions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(40), default="dlocal_go", index=True)
    provider_payment_id: Mapped[str | None] = mapped_column(
        String(160),
        unique=True,
        index=True,
        nullable=True,
    )
    plan_key: Mapped[str] = mapped_column(String(40), default="school", index=True)
    status: Mapped[str] = mapped_column(String(40), default="created", index=True)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    country: Mapped[str] = mapped_column(String(2), default="UY")
    checkout_url: Mapped[str] = mapped_column(Text, default="")
    access_starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    access_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    provider_status_detail: Mapped[str] = mapped_column(String(240), default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class InstitutionUser(Base):
    __tablename__ = "institution_users"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(40), default="institution_admin", index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    access_code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="active")

    institution: Mapped[Institution] = relationship(back_populates="users")


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


class AuthCredential(Base):
    __tablename__ = "auth_credentials"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    role: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    entity_id: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    institution_id: Mapped[str] = mapped_column(String(80), index=True, default="")
    identifier: Mapped[str] = mapped_column(String(160), index=True, default="")
    credential_lookup: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    credential_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="active", index=True)


class RateLimitCounter(Base):
    __tablename__ = "rate_limit_counters"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    window_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    request_count: Mapped[int] = mapped_column(Integer, default=0)


class InstitutionLead(Base):
    __tablename__ = "institution_leads"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    institution_name: Mapped[str] = mapped_column(String(160), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    student_count: Mapped[str] = mapped_column(String(80), default="")
    plan_key: Mapped[str] = mapped_column(String(40), default="school", index=True)
    status: Mapped[str] = mapped_column(String(40), default="new", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


def validate_plain_text(value: str) -> str:
    clean = value.strip()
    if any(char in clean for char in "<>"):
        raise ValueError("No se permiten etiquetas HTML.")
    if any(ord(char) < 32 and char not in "\t\n\r" for char in clean):
        raise ValueError("El texto contiene caracteres no permitidos.")
    return clean


class LoginRequest(BaseModel):
    role: str
    name: str = ""
    code: str = Field(min_length=1, max_length=128)


class ClassroomCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    grade_label: str = Field(min_length=2, max_length=40)

    _clean_name = field_validator("name", "grade_label")(validate_plain_text)


class StudentCreateRequest(BaseModel):
    classroom_id: str
    name: str = Field(min_length=2, max_length=40)
    display_name: str = Field(default="")
    student_code: str = Field(default="")

    _clean_student = field_validator("name", "display_name", "student_code")(validate_plain_text)


class GuardianLinkRequest(BaseModel):
    student_id: str
    guardian_name: str = Field(min_length=2, max_length=60)
    guardian_code: str = Field(min_length=4, max_length=20)
    contact: str = Field(default="")

    _clean_guardian = field_validator("guardian_name", "guardian_code", "contact")(validate_plain_text)


class InstitutionRegisterRequest(BaseModel):
    institution_name: str = Field(min_length=2, max_length=160)
    institution_code: str = Field(min_length=4, max_length=40)
    admin_name: str = Field(min_length=2, max_length=120)
    admin_email: str = Field(min_length=5, max_length=160)
    admin_access_code: str = Field(min_length=10, max_length=80)
    department: str = Field(default="", max_length=80)
    billing_email: str = Field(default="", max_length=160)

    _clean_institution = field_validator(
        "institution_name",
        "institution_code",
        "admin_name",
        "admin_email",
        "admin_access_code",
        "department",
        "billing_email",
    )(validate_plain_text)


class InstitutionPlanRequestRequest(BaseModel):
    plan_key: str = Field(default="school", max_length=40)
    institution_name: str = Field(min_length=2, max_length=160)
    contact_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=160)
    student_count: str = Field(default="", max_length=80)

    _clean_plan_request = field_validator(
        "institution_name", "contact_name", "email", "student_count"
    )(validate_plain_text)


class BillingCheckoutRequest(BaseModel):
    plan_key: str = Field(default="school", max_length=40)
    country: str = Field(default="UY", min_length=2, max_length=2)

    _clean_billing = field_validator("plan_key", "country")(validate_plain_text)


IS_PRODUCTION = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV") == "production")
SESSION_COOKIE = "yoaprendo_session"
SESSION_TTL_SECONDS = 8 * 60 * 60
ALLOWED_ORIGINS = [
    item.strip()
    for item in os.getenv(
        "ALLOWED_ORIGINS",
        "https://yoaprendo.org,https://www.yoaprendo.org,http://127.0.0.1:4173,http://localhost:4173",
    ).split(",")
    if item.strip()
]
SESSION_SECRET = os.getenv("SESSION_SECRET") or os.getenv("PRODUCT_OWNER_PASSWORD")
if not SESSION_SECRET and not IS_PRODUCTION:
    SESSION_SECRET = "yoaprendo-local-development-only"
DLOCAL_API_KEY = os.getenv("DLOCAL_API_KEY", "").strip()
DLOCAL_SECRET_KEY = os.getenv("DLOCAL_SECRET_KEY", "").strip()
DLOCAL_API_BASE = os.getenv(
    "DLOCAL_API_BASE",
    "https://api.dlocalgo.com" if IS_PRODUCTION else "https://api-sbx.dlocalgo.com",
).rstrip("/")
PUBLIC_APP_URL = os.getenv(
    "PUBLIC_APP_URL",
    "https://yoaprendo.org" if IS_PRODUCTION else "http://127.0.0.1:4173",
).rstrip("/")
DLOCAL_SCHOOL_PRICE_RAW = os.getenv("DLOCAL_SCHOOL_PRICE_USD", "").strip()
DLOCAL_SCHOOL_PRICE_USD = DLOCAL_SCHOOL_PRICE_RAW or "49.00"
DLOCAL_REQUEST_TIMEOUT_SECONDS = 12

app = FastAPI(
    title="YoAprendo API",
    version="0.4.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None,
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Requested-With"],
)


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    if request.method not in {"GET", "HEAD", "OPTIONS"} and origin and origin not in ALLOWED_ORIGINS:
        return Response(status_code=403, content="Origen no permitido.")

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, private"
        response.headers["Pragma"] = "no-cache"
    return response


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


def require_session_secret() -> str:
    if not SESSION_SECRET:
        raise HTTPException(status_code=503, detail="La autenticacion no esta configurada.")
    return SESSION_SECRET


def normalize_identifier(value: str) -> str:
    return value.strip().casefold()


def credential_lookup(code: str) -> str:
    return hashlib.sha256(code.strip().encode("utf-8")).hexdigest()


def hash_credential(code: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", code.encode("utf-8"), salt, 310_000)
    return "pbkdf2_sha256$310000$" + base64.urlsafe_b64encode(salt).decode() + "$" + base64.urlsafe_b64encode(digest).decode()


def verify_credential(code: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt_value, digest_value = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.urlsafe_b64decode(salt_value.encode())
        expected = base64.urlsafe_b64decode(digest_value.encode())
        actual = hashlib.pbkdf2_hmac("sha256", code.encode("utf-8"), salt, int(iterations))
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_credential(
    session: Session,
    role: str,
    entity_id: str,
    code: str,
    identifier: str = "",
    institution_id: str = "",
    allow_conflict: bool = False,
) -> AuthCredential | None:
    lookup = credential_lookup(code)
    existing = session.scalar(select(AuthCredential).where(AuthCredential.credential_lookup == lookup))
    if existing:
        if existing.role == role and existing.entity_id == entity_id:
            return existing
        if allow_conflict:
            return None
        raise HTTPException(status_code=409, detail="Ese codigo de acceso ya esta en uso.")
    credential = AuthCredential(
        id=unique_id(session, AuthCredential, "cred", f"{role}-{entity_id}"),
        role=role,
        entity_id=entity_id,
        institution_id=institution_id,
        identifier=normalize_identifier(identifier),
        credential_lookup=lookup,
        credential_hash=hash_credential(code),
    )
    session.add(credential)
    return credential


def find_credential(session: Session, role: str, code: str) -> AuthCredential | None:
    if not code.strip():
        return None
    lookup = credential_lookup(code)
    credential = session.scalar(
        select(AuthCredential).where(
            AuthCredential.role == role,
            AuthCredential.credential_lookup == lookup,
            AuthCredential.status == "active",
        )
    )
    if not credential or not verify_credential(code, credential.credential_hash):
        return None
    return credential


def sign_session(payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    encoded = base64.urlsafe_b64encode(raw).decode().rstrip("=")
    signature = hmac.new(require_session_secret().encode(), encoded.encode(), hashlib.sha256).digest()
    return encoded + "." + base64.urlsafe_b64encode(signature).decode().rstrip("=")


def read_session_token(token: str) -> dict | None:
    try:
        encoded, provided_signature = token.split(".", 1)
        expected = hmac.new(require_session_secret().encode(), encoded.encode(), hashlib.sha256).digest()
        provided = base64.urlsafe_b64decode(provided_signature + "=" * (-len(provided_signature) % 4))
        if not hmac.compare_digest(expected, provided):
            return None
        raw = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
        payload = json.loads(raw)
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def session_payload(role: str, entity_id: str, display_name: str, institution_id: str = "") -> dict:
    now = int(time.time())
    return {
        "role": role,
        "entity_id": entity_id,
        "display_name": display_name,
        "institution_id": institution_id,
        "iat": now,
        "exp": now + SESSION_TTL_SECONDS,
        "nonce": secrets.token_urlsafe(12),
    }


def set_session_cookie(response: Response, session_data: dict) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        sign_session(session_data),
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        path="/",
    )


def get_current_session(request: Request) -> dict:
    token = request.cookies.get(SESSION_COOKIE, "")
    payload = read_session_token(token) if token else None
    if not payload:
        raise HTTPException(status_code=401, detail="Inicia sesion para continuar.")
    return payload


def authorize(
    current: dict,
    roles: set[str],
    entity_id: str | None = None,
    institution_id: str | None = None,
) -> None:
    if current.get("role") == "owner":
        return
    if current.get("role") not in roles:
        raise HTTPException(status_code=403, detail="No tienes permiso para realizar esta accion.")
    if entity_id is not None and current.get("entity_id") != entity_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este registro.")
    if institution_id is not None and current.get("institution_id") != institution_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta institucion.")


def enforce_rate_limit(request: Request, bucket: str, limit: int, window_seconds: int) -> None:
    forwarded = request.headers.get("x-forwarded-for", "")
    client_ip = forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")
    private_key = hmac.new(
        require_session_secret().encode(),
        f"{bucket}:{client_ip}".encode(),
        hashlib.sha256,
    ).hexdigest()
    counter_id = private_key[:80]
    now = datetime.now(timezone.utc)
    with db_session() as session:
        counter = session.scalar(
            select(RateLimitCounter)
            .where(RateLimitCounter.id == counter_id)
            .with_for_update()
        )
        if not counter:
            session.add(
                RateLimitCounter(
                    id=counter_id,
                    window_started_at=now,
                    request_count=1,
                )
            )
            return

        started = counter.window_started_at
        if started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)
        if (now - started).total_seconds() >= window_seconds:
            counter.window_started_at = now
            counter.request_count = 1
            return
        if counter.request_count >= limit:
            raise HTTPException(status_code=429, detail="Demasiados intentos. Intenta nuevamente mas tarde.")
        counter.request_count += 1


def load_seed() -> dict:
    seed_path = Path(__file__).with_name("data.json")
    return json.loads(seed_path.read_text(encoding="utf-8"))


def default_subscription(institution_id: str, billing_email: str = "") -> InstitutionSubscription:
    return InstitutionSubscription(
        institution_id=institution_id,
        plan_key="trial",
        status="trialing",
        student_limit=50,
        teacher_limit=2,
        billing_email=billing_email,
        billing_provider="manual",
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=90),
    )


def aware_datetime(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=timezone.utc)


def school_price_cents() -> int:
    try:
        amount = Decimal(DLOCAL_SCHOOL_PRICE_USD).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except InvalidOperation as exc:
        raise HTTPException(status_code=503, detail="El precio del Plan Escuela no esta configurado.") from exc
    if amount <= 0:
        raise HTTPException(status_code=503, detail="El precio del Plan Escuela no esta configurado.")
    return int(amount * 100)


def billing_is_configured() -> bool:
    return bool(DLOCAL_API_KEY and DLOCAL_SECRET_KEY and DLOCAL_SCHOOL_PRICE_RAW)


def latest_billing_payment(session: Session, institution_id: str) -> BillingPayment | None:
    return session.scalar(
        select(BillingPayment)
        .where(BillingPayment.institution_id == institution_id)
        .order_by(BillingPayment.created_at.desc())
        .limit(1)
    )


def institution_access_state(session: Session, institution: Institution) -> dict:
    now = datetime.now(timezone.utc)
    subscription = institution.subscription or default_subscription(institution.id, institution.teacher_email)
    trial_ends_at = aware_datetime(subscription.trial_ends_at)
    latest_payment = latest_billing_payment(session, institution.id)
    active_paid_payment = session.scalar(
        select(BillingPayment)
        .where(
            BillingPayment.institution_id == institution.id,
            BillingPayment.status == "paid",
            BillingPayment.access_ends_at > now,
        )
        .order_by(BillingPayment.access_ends_at.desc())
        .limit(1)
    )
    paid_until = aware_datetime(active_paid_payment.access_ends_at) if active_paid_payment else None

    if subscription.status in {"refunded", "chargeback"}:
        allowed = False
        reason = subscription.status
    elif subscription.plan_key == "enterprise" and subscription.status == "active":
        allowed = True
        reason = "enterprise_active"
    elif active_paid_payment and paid_until and paid_until > now:
        allowed = True
        reason = "paid"
    elif trial_ends_at and trial_ends_at > now:
        allowed = True
        reason = "trial"
    else:
        allowed = False
        reason = "payment_required"

    return {
        "allowed": allowed,
        "reason": reason,
        "paid_until": paid_until,
        "latest_payment": latest_payment,
    }


def require_learning_access(session: Session, institution_id: str) -> None:
    institution = session.get(Institution, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    if not institution_access_state(session, institution)["allowed"]:
        raise HTTPException(
            status_code=402,
            detail="La suscripcion de la institucion requiere un pago para continuar.",
        )


def dlocal_authorization() -> str:
    if not DLOCAL_API_KEY or not DLOCAL_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Los pagos todavia no estan configurados.")
    return f"Bearer {DLOCAL_API_KEY}:{DLOCAL_SECRET_KEY}"


def dlocal_request(method: str, path: str, payload: dict | None = None) -> dict:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        f"{DLOCAL_API_BASE}{path}",
        data=body,
        method=method,
        headers={
            "Authorization": dlocal_authorization(),
            "Content-Type": "application/json",
            "User-Agent": "YoAprendo/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=DLOCAL_REQUEST_TIMEOUT_SECONDS) as response:
            response_body = response.read()
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        raise HTTPException(
            status_code=502,
            detail="No pudimos comunicarnos con el proveedor de pagos. Intenta nuevamente.",
        ) from exc

    try:
        result = json.loads(response_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="El proveedor de pagos devolvio una respuesta invalida.") from exc
    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="El proveedor de pagos devolvio una respuesta invalida.")
    return result


def valid_dlocal_checkout_url(value: str) -> bool:
    parsed = urlparse(value)
    hostname = (parsed.hostname or "").lower()
    return parsed.scheme == "https" and (
        hostname == "checkout.dlocalgo.com"
        or hostname == "checkout-sbx.dlocalgo.com"
        or hostname.endswith(".dlocalgo.com")
    )


def amount_to_cents(value: object) -> int:
    try:
        return int(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) * 100)
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise HTTPException(status_code=409, detail="El monto informado por el proveedor no coincide.") from exc


def apply_dlocal_payment_status(
    session: Session,
    payment: BillingPayment,
    provider_payment: dict,
) -> BillingPayment:
    provider_id = str(provider_payment.get("id", "")).strip()
    order_id = str(provider_payment.get("order_id", "")).strip()
    currency = str(provider_payment.get("currency", "")).strip().upper()
    provider_status = str(provider_payment.get("status", "")).strip().upper()

    if not provider_id or provider_id != payment.provider_payment_id:
        payment.status = "review"
        raise HTTPException(status_code=409, detail="La referencia del pago no coincide.")
    if order_id and order_id != payment.id:
        payment.status = "review"
        raise HTTPException(status_code=409, detail="La orden del pago no coincide.")
    if currency != payment.currency or amount_to_cents(provider_payment.get("amount")) != payment.amount_cents:
        payment.status = "review"
        raise HTTPException(status_code=409, detail="Los datos economicos del pago no coinciden.")

    previous_status = payment.status
    normalized_statuses = {
        "PAID": "paid",
        "PENDING": "pending",
        "CREATED": "pending",
        "REJECTED": "rejected",
        "DECLINED": "rejected",
        "CANCELLED": "cancelled",
        "CANCELED": "cancelled",
        "EXPIRED": "expired",
        "REFUNDED": "refunded",
        "CHARGEBACK": "chargeback",
    }
    payment.provider_status_detail = str(
        provider_payment.get("status_detail") or provider_payment.get("status_details") or ""
    )[:240]
    payment.updated_at = datetime.now(timezone.utc)
    normalized_status = normalized_statuses.get(provider_status)
    if not normalized_status:
        payment.status = previous_status if previous_status == "paid" else "review"
        session.flush()
        return payment
    payment.status = normalized_status

    institution = session.get(Institution, payment.institution_id)
    if not institution or not institution.subscription:
        raise HTTPException(status_code=404, detail="Institution not found")
    subscription = institution.subscription
    subscription.billing_provider = "dlocal_go"
    subscription.billing_customer_id = provider_id

    if payment.status == "paid":
        if previous_status != "paid" or not payment.access_ends_at:
            previous_paid = session.scalar(
                select(BillingPayment)
                .where(
                    BillingPayment.institution_id == payment.institution_id,
                    BillingPayment.id != payment.id,
                    BillingPayment.status == "paid",
                )
                .order_by(BillingPayment.access_ends_at.desc())
                .limit(1)
            )
            previous_end = aware_datetime(previous_paid.access_ends_at) if previous_paid else None
            payment.access_starts_at = max(
                datetime.now(timezone.utc),
                previous_end or datetime.now(timezone.utc),
            )
            payment.access_ends_at = payment.access_starts_at + timedelta(days=30)
        subscription.plan_key = payment.plan_key
        subscription.status = "active"
        subscription.student_limit = 300
        subscription.teacher_limit = 999
    elif payment.status in {"refunded", "chargeback"}:
        payment.access_ends_at = datetime.now(timezone.utc)
        subscription.status = payment.status
    elif payment.status in {"rejected", "cancelled", "expired", "review"}:
        if subscription.status != "active":
            subscription.status = "payment_failed"
    elif payment.status == "pending" and subscription.status != "active":
        subscription.status = "payment_pending"

    session.flush()
    return payment


def billing_payment_payload(payment: BillingPayment | None) -> dict | None:
    if not payment:
        return None
    return {
        "id": payment.id,
        "plan_key": payment.plan_key,
        "status": payment.status,
        "amount": f"{payment.amount_cents / 100:.2f}",
        "currency": payment.currency,
        "checkout_url": payment.checkout_url if payment.status in {"created", "pending"} else "",
        "access_ends_at": aware_datetime(payment.access_ends_at).isoformat() if payment.access_ends_at else None,
        "created_at": aware_datetime(payment.created_at).isoformat(),
    }


def seed_database(session: Session) -> None:
    if session.scalar(select(Institution.id).limit(1)):
        return
    if os.getenv("YOAPRENDO_SEED_DEMO", "").lower() not in {"1", "true", "yes"}:
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

    for institution in institutions.values():
        session.add(default_subscription(institution.id, institution.teacher_email))

    demo_institution = institutions.get("inst-uy")
    if demo_institution:
        session.add(
            InstitutionUser(
                id="user-inst-admin-demo",
                institution_id=demo_institution.id,
                role="institution_admin",
                name=demo_institution.teacher_name or demo_institution.name,
                email=demo_institution.teacher_email or "admin@yoaprendo.demo",
                access_code=demo_institution.code,
            )
        )


def remove_known_demo_data(session: Session) -> None:
    if os.getenv("YOAPRENDO_KEEP_DEMO_DATA", "").lower() in {"1", "true", "yes"}:
        return

    demo_institution_ids = [
        row[0]
        for row in session.execute(
            select(Institution.id).where(
                Institution.code.in_(["INST-4A"]),
                Institution.teacher_email.like("%@yoaprendo.demo"),
            )
        ).all()
    ]
    if not demo_institution_ids:
        return

    demo_classroom_ids = [
        row[0]
        for row in session.execute(
            select(Classroom.id).where(Classroom.institution_id.in_(demo_institution_ids))
        ).all()
    ]
    demo_student_ids = [
        row[0]
        for row in session.execute(
            select(Student.id).where(Student.classroom_id.in_(demo_classroom_ids))
        ).all()
    ]
    demo_teacher_ids = [
        row[0]
        for row in session.execute(
            select(Teacher.id).where(Teacher.institution_id.in_(demo_institution_ids))
        ).all()
    ]
    demo_guardian_ids = [
        row[0]
        for row in session.execute(
            select(Guardian.id).where(Guardian.code.in_(["FAM-404"]))
        ).all()
    ]

    if demo_guardian_ids:
        session.execute(delete(guardian_students).where(guardian_students.c.guardian_id.in_(demo_guardian_ids)))
        session.execute(delete(Guardian).where(Guardian.id.in_(demo_guardian_ids)))
    if demo_student_ids:
        session.execute(delete(guardian_students).where(guardian_students.c.student_id.in_(demo_student_ids)))
        session.execute(delete(Student).where(Student.id.in_(demo_student_ids)))
    if demo_teacher_ids:
        session.execute(delete(teacher_classrooms).where(teacher_classrooms.c.teacher_id.in_(demo_teacher_ids)))
        session.execute(delete(Teacher).where(Teacher.id.in_(demo_teacher_ids)))
    if demo_classroom_ids:
        session.execute(delete(teacher_classrooms).where(teacher_classrooms.c.classroom_id.in_(demo_classroom_ids)))
        session.execute(delete(Classroom).where(Classroom.id.in_(demo_classroom_ids)))

    session.execute(delete(InstitutionUser).where(InstitutionUser.institution_id.in_(demo_institution_ids)))
    session.execute(delete(InstitutionSubscription).where(InstitutionSubscription.institution_id.in_(demo_institution_ids)))
    session.execute(delete(AuthCredential).where(AuthCredential.institution_id.in_(demo_institution_ids)))
    session.execute(delete(Institution).where(Institution.id.in_(demo_institution_ids)))


def ensure_subscription_rows(session: Session) -> None:
    institutions = session.scalars(select(Institution)).all()
    for institution in institutions:
        if institution.subscription is None:
            session.add(default_subscription(institution.id, institution.teacher_email))
        if institution.subscription and institution.subscription.status == "lead":
            continue
        if not institution.users:
            session.add(
                InstitutionUser(
                    id=unique_id(session, InstitutionUser, "user", institution.name),
                    institution_id=institution.id,
                    role="institution_admin",
                    name=institution.teacher_name or institution.name,
                    email=institution.teacher_email or f"{institution.id}@yoaprendo.local",
                    access_code=institution.code,
                )
            )



def remove_custom_demo_users(session: Session) -> None:
    demo_student = session.get(Student, "stu-jairo")
    demo_classroom = session.get(Classroom, "class-jairo")
    demo_institution = session.get(Institution, "inst-jairo")
    if demo_student:
        session.execute(delete(guardian_students).where(guardian_students.c.student_id == demo_student.id))
        session.delete(demo_student)
    if demo_classroom:
        session.execute(delete(teacher_classrooms).where(teacher_classrooms.c.classroom_id == demo_classroom.id))
        session.delete(demo_classroom)
    if demo_institution:
        session.execute(delete(AuthCredential).where(AuthCredential.institution_id == demo_institution.id))
        session.execute(delete(InstitutionUser).where(InstitutionUser.institution_id == demo_institution.id))
        session.execute(delete(InstitutionSubscription).where(InstitutionSubscription.institution_id == demo_institution.id))
        session.delete(demo_institution)


def migrate_credentials(session: Session) -> None:
    for admin in session.scalars(select(InstitutionUser)).all():
        existing = session.scalar(
            select(AuthCredential).where(
                AuthCredential.role == "institution",
                AuthCredential.entity_id == admin.institution_id,
            )
        )
        if not existing and admin.access_code and not admin.access_code.startswith("protected-"):
            create_credential(
                session,
                "institution",
                admin.institution_id,
                admin.access_code,
                admin.email,
                admin.institution_id,
                allow_conflict=True,
            )
            admin.access_code = f"protected-{secrets.token_urlsafe(18)}"

    for teacher in session.scalars(select(Teacher)).all():
        existing = session.scalar(
            select(AuthCredential).where(AuthCredential.role == "teacher", AuthCredential.entity_id == teacher.id)
        )
        if not existing and teacher.code and not teacher.code.startswith("protected-"):
            create_credential(
                session,
                "teacher",
                teacher.id,
                teacher.code,
                teacher.email,
                teacher.institution_id,
                allow_conflict=True,
            )
            teacher.code = f"protected-{secrets.token_urlsafe(12)}"

    for student in session.scalars(select(Student)).all():
        existing = session.scalar(
            select(AuthCredential).where(AuthCredential.role == "student", AuthCredential.entity_id == student.id)
        )
        if not existing and student.student_code and not student.student_code.startswith("protected-"):
            create_credential(
                session,
                "student",
                student.id,
                student.student_code,
                student.name,
                student.classroom.institution_id,
                allow_conflict=True,
            )
            student.student_code = f"protected-{secrets.token_urlsafe(12)}"

    for guardian in session.scalars(select(Guardian)).all():
        existing = session.scalar(
            select(AuthCredential).where(AuthCredential.role == "parent", AuthCredential.entity_id == guardian.id)
        )
        institution_ids = {
            student.classroom.institution_id for student in guardian.students if student.classroom
        }
        institution_id = next(iter(institution_ids), "")
        if not existing and guardian.code and not guardian.code.startswith("protected-"):
            create_credential(
                session,
                "parent",
                guardian.id,
                guardian.code,
                guardian.name,
                institution_id,
                allow_conflict=True,
            )
            guardian.code = f"protected-{secrets.token_urlsafe(12)}"


def migrate_legacy_leads(session: Session) -> None:
    legacy_institutions = [
        institution
        for institution in session.scalars(select(Institution)).all()
        if institution.subscription and institution.subscription.status == "lead"
    ]
    for institution in legacy_institutions:
        existing = session.scalar(
            select(InstitutionLead).where(
                InstitutionLead.email == institution.teacher_email,
                InstitutionLead.institution_name == institution.name,
            )
        )
        if not existing:
            session.add(
                InstitutionLead(
                    id=unique_id(session, InstitutionLead, "lead", institution.name),
                    institution_name=institution.name,
                    contact_name=institution.teacher_name,
                    email=institution.teacher_email,
                    student_count=institution.notes,
                    plan_key=institution.subscription.plan_key,
                    status="new",
                )
            )
        if not institution.classrooms and not institution.teachers:
            session.execute(delete(AuthCredential).where(AuthCredential.institution_id == institution.id))
            session.execute(delete(InstitutionUser).where(InstitutionUser.institution_id == institution.id))
            session.execute(delete(InstitutionSubscription).where(InstitutionSubscription.institution_id == institution.id))
            session.delete(institution)


@app.on_event("startup")
def init_database() -> None:
    Base.metadata.create_all(bind=engine)
    with db_session() as session:
        session.execute(
            delete(RateLimitCounter).where(
                RateLimitCounter.window_started_at < datetime.now(timezone.utc) - timedelta(days=7)
            )
        )
        seed_database(session)
        remove_known_demo_data(session)
        remove_custom_demo_users(session)
        migrate_legacy_leads(session)
        ensure_subscription_rows(session)
        migrate_credentials(session)



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


def unique_group_code(session: Session, value: str) -> str:
    base = f"AULA-{value.upper().replace(' ', '')[:12]}" or "AULA-NUEVA"
    candidate = base
    suffix = 1
    while session.scalar(select(Classroom).where(Classroom.group_code == candidate)):
        suffix += 1
        candidate = f"{base}-{suffix}"
    return candidate


def unique_student_code(session: Session, value: str) -> str:
    base = value or "ALUMNO"
    candidate = base
    suffix = 1
    while session.scalar(select(Student).where(Student.student_code == candidate)):
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
        "student_code": "Acceso protegido",
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


def subscription_payload(
    session: Session,
    institution: Institution,
    student_count: int,
    teacher_count: int,
) -> dict:
    subscription = institution.subscription or default_subscription(institution.id, institution.teacher_email)
    access = institution_access_state(session, institution)
    latest_payment = access["latest_payment"]
    effective_status = subscription.status
    if not access["allowed"] and effective_status == "trialing":
        effective_status = "trial_expired"
    return {
        "plan_key": subscription.plan_key,
        "status": effective_status,
        "student_limit": subscription.student_limit,
        "teacher_limit": subscription.teacher_limit,
        "student_count": student_count,
        "teacher_count": teacher_count,
        "trial_ends_at": subscription.trial_ends_at.isoformat() if subscription.trial_ends_at else None,
        "access_allowed": access["allowed"],
        "access_reason": access["reason"],
        "can_add_students": access["allowed"]
        and (student_count < subscription.student_limit or subscription.plan_key == "enterprise"),
        "can_add_teachers": access["allowed"]
        and (teacher_count < subscription.teacher_limit or subscription.plan_key == "enterprise"),
        "latest_payment": billing_payment_payload(latest_payment),
        "school_price": f"{school_price_cents() / 100:.2f}",
        "school_currency": "USD",
        "billing_configured": billing_is_configured(),
    }


def institution_dashboard(session: Session, institution_id: str) -> dict:
    institution = session.get(Institution, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    classrooms = institution.classrooms
    students = [student for classroom in classrooms for student in classroom.students]
    guardians = [
        guardian
        for guardian in session.scalars(select(Guardian)).all()
        if any(student.classroom.institution_id == institution_id for student in guardian.students)
    ]

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
        "subscription": subscription_payload(session, institution, len(students), len(institution.teachers)),
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
            "code": "Acceso protegido",
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


def owner_dashboard(session: Session) -> dict:
    institutions = session.scalars(select(Institution)).all()
    leads = session.scalars(select(InstitutionLead).order_by(InstitutionLead.created_at.desc())).all()
    classrooms = session.scalars(select(Classroom)).all()
    students = session.scalars(select(Student)).all()
    teachers = session.scalars(select(Teacher)).all()
    guardians = session.scalars(select(Guardian)).all()
    payments = session.scalars(
        select(BillingPayment).order_by(BillingPayment.created_at.desc())
    ).all()

    plan_counts = {"trial": 0, "school": 0, "enterprise": 0}
    institution_rows = []
    expansion_candidates = []

    for institution in institutions:
        institution_classrooms = institution.classrooms
        institution_students = [student for classroom in institution_classrooms for student in classroom.students]
        institution_guardians = [
            guardian
            for guardian in guardians
            if any(student.classroom.institution_id == institution.id for student in guardian.students)
        ]
        plan = institution.subscription.plan_key if institution.subscription else "trial"
        plan_counts[plan] = plan_counts.get(plan, 0) + 1
        avg_completion = round(mean(student_percent(student) for student in institution_students)) if institution_students else 0
        alerts = sum(1 for student in institution_students if student.attendance != "Activa")
        row = {
            "id": institution.id,
            "name": institution.name,
            "contact": institution.teacher_name,
            "email": institution.teacher_email,
            "plan": plan,
            "status": institution.subscription.status if institution.subscription else "trialing",
            "notes": institution.notes,
            "students": len(institution_students),
            "teachers": len(institution.teachers),
            "classrooms": len(institution_classrooms),
            "guardians": len(institution_guardians),
            "avg_completion": avg_completion,
            "alerts": alerts,
        }
        institution_rows.append(row)
        if plan == "trial" and (len(institution_students) >= 20 or avg_completion >= 35 or len(institution_guardians) >= 5):
            expansion_candidates.append(row)

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

    active_students = sum(1 for student in students if student.attendance == "Activa")
    linked_guardians = sum(1 for guardian in guardians if guardian.students)
    avg_completion = round(mean(student_percent(student) for student in students)) if students else 0

    return {
        "owner": {"name": "Jairo Rifran", "role": "Product owner"},
        "summary": {
            "institutions": len(institutions),
            "classrooms": len(classrooms),
            "students": len(students),
            "teachers": len(teachers),
            "guardians": len(guardians),
            "linked_guardians": linked_guardians,
            "active_students": active_students,
            "avg_completion": avg_completion,
            "weekly_minutes": sum(student.weekly_minutes for student in students),
            "at_risk_students": sum(1 for student in students if student.attendance != "Activa"),
            "expansion_candidates": len(expansion_candidates),
            "commercial_leads": len(leads),
            "payments": len(payments),
            "paid_revenue_usd": f"{sum(item.amount_cents for item in payments if item.status == 'paid') / 100:.2f}",
        },
        "plan_breakdown": plan_counts,
        "funnel": {
            "registered_institutions": len(institutions),
            "with_classrooms": sum(1 for institution in institutions if institution.classrooms),
            "with_students": sum(
                1
                for institution in institutions
                if any(classroom.students for classroom in institution.classrooms)
            ),
            "with_family_links": sum(
                1
                for institution in institutions
                if any(
                    guardian.students
                    and any(student.classroom.institution_id == institution.id for student in guardian.students)
                    for guardian in guardians
                )
            ),
        },
        "concept_overview": concept_overview,
        "institutions": sorted(institution_rows, key=lambda item: item["students"], reverse=True),
        "details": {
            "institutions": institution_rows,
            "leads": [
                {
                    "name": lead.institution_name,
                    "contact": lead.contact_name,
                    "email": lead.email,
                    "plan": lead.plan_key,
                    "status": lead.status,
                    "notes": f"Alumnos estimados: {lead.student_count or 'Sin dato'}",
                }
                for lead in leads
            ],
            "payments": [
                {
                    "id": payment.id,
                    "institution": session.get(Institution, payment.institution_id).name
                    if session.get(Institution, payment.institution_id)
                    else payment.institution_id,
                    "plan": payment.plan_key,
                    "status": payment.status,
                    "amount": f"{payment.amount_cents / 100:.2f} {payment.currency}",
                    "created_at": aware_datetime(payment.created_at).isoformat(),
                    "access_ends_at": aware_datetime(payment.access_ends_at).isoformat()
                    if payment.access_ends_at
                    else "",
                }
                for payment in payments
            ],
            "students": [
                {
                    "id": student.id,
                    "name": student.display_name,
                    "institution": student.classroom.institution.name,
                    "classroom": student.classroom.name,
                    "code": student.student_code,
                    "attendance": student.attendance,
                    "progress": student_percent(student),
                    "weekly_minutes": student.weekly_minutes,
                    "needs_support": student.needs_support,
                }
                for student in students
            ],
            "active": [
                {
                    "name": student.display_name,
                    "institution": student.classroom.institution.name,
                    "classroom": student.classroom.name,
                    "progress": student_percent(student),
                    "weekly_minutes": student.weekly_minutes,
                }
                for student in students
                if student.attendance == "Activa"
            ],
            "teachers": [
                {
                    "name": teacher.name,
                    "email": teacher.email,
                    "institution": teacher.institution.name,
                    "classrooms": len(teacher.classrooms),
                }
                for teacher in teachers
            ],
            "families": [
                {
                    "name": guardian.name,
                    "contact": guardian.contact,
                    "students": len(guardian.students),
                    "student_names": ", ".join(student.display_name for student in guardian.students),
                }
                for guardian in guardians
            ],
            "alerts": [
                {
                    "name": student.display_name,
                    "institution": student.classroom.institution.name,
                    "classroom": student.classroom.name,
                    "attendance": student.attendance,
                    "needs_support": student.needs_support,
                    "message": student.teacher_message,
                }
                for student in students
                if student.attendance != "Activa"
            ],
            "minutes": [
                {
                    "name": student.display_name,
                    "institution": student.classroom.institution.name,
                    "weekly_minutes": student.weekly_minutes,
                    "progress": student_percent(student),
                }
                for student in sorted(students, key=lambda item: item.weekly_minutes, reverse=True)
            ],
            "progress": concept_overview,
        },
        "expansion_candidates": expansion_candidates,
        "ceibal_evidence": [
            "Modelo institucional: la escuela administra docentes, aulas, alumnos y familias.",
            "Datos agregados para medir adopcion, actividad, progreso y alertas pedagogicas.",
            "Arquitectura portable con PostgreSQL y roles preparados para integracion institucional.",
        ],
    }


def guardian_payload(guardian: Guardian) -> dict:
    return {
        "id": guardian.id,
        "name": guardian.name,
        "code": "Acceso protegido",
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
    role = payload.role.strip().lower()
    code = payload.code.strip()
    name = normalize_identifier(payload.name)
    owner_email = normalize_identifier(os.getenv("PRODUCT_OWNER_EMAIL", "rifranjairo@gmail.com"))
    owner_password = os.getenv("PRODUCT_OWNER_PASSWORD", "")

    if role in {"owner", "platform_admin"}:
        password_matches = (
            bool(owner_password)
            and name == owner_email
            and hmac.compare_digest(code, owner_password)
        )
        if not password_matches:
            raise HTTPException(status_code=401, detail="Credenciales invalidas.")
        return {
            "role": "owner",
            "display_name": "Jairo Rifran",
            "entity_id": "owner",
            "redirect_view": "dashboard",
            "institution_id": "",
            "context": {"scope": "platform"},
        }

    if role not in {"student", "parent", "teacher", "institution"}:
        raise HTTPException(status_code=400, detail="Rol no soportado.")

    credential = find_credential(session, role, code)
    if not credential:
        raise HTTPException(status_code=401, detail="Credenciales invalidas.")
    if role == "institution" and credential.identifier and name != credential.identifier:
        raise HTTPException(status_code=401, detail="Credenciales invalidas.")
    if role in {"student", "parent", "teacher"}:
        require_learning_access(session, credential.institution_id)

    if role == "student":
        match = get_student(session, credential.entity_id)
        return {
            "role": "student",
            "display_name": match.display_name,
            "entity_id": match.id,
            "redirect_view": "world-map",
            "institution_id": match.classroom.institution_id,
            "context": {"classroom_name": match.classroom.name, "grade_label": match.classroom.grade_label},
        }

    if role == "parent":
        match = get_guardian(session, credential.entity_id)
        return {
            "role": "parent",
            "display_name": match.name,
            "entity_id": match.id,
            "redirect_view": "dashboard",
            "institution_id": credential.institution_id,
            "context": {"children_count": len(match.students)},
        }

    if role == "institution":
        match = session.get(Institution, credential.entity_id)
        if not match:
            raise HTTPException(status_code=401, detail="Credenciales invalidas.")
        return {
            "role": "institution",
            "display_name": match.name,
            "entity_id": match.id,
            "redirect_view": "dashboard",
            "institution_id": match.id,
            "context": {
                "teacher_name": match.teacher_name,
                "plan": match.subscription.plan_key if match.subscription else "trial",
            },
        }

    if role == "teacher":
        match = session.get(Teacher, credential.entity_id)
        if not match:
            raise HTTPException(status_code=401, detail="Credenciales invalidas.")
        return {
            "role": "teacher",
            "display_name": match.name,
            "entity_id": match.id,
            "redirect_view": "dashboard",
            "institution_id": match.institution_id,
            "context": {"institution_name": match.institution.name},
        }

    raise HTTPException(status_code=400, detail="Rol no soportado.")


@app.get("/api/health")
def health():
    with db_session() as session:
        session.execute(select(1))
    return {"ok": True}


@app.get("/api/plans")
def plans():
    return {
        "plans": [
            {
                "key": "trial",
                "name": "Piloto",
                "price": "90 dias gratis",
                "student_limit": 50,
                "teacher_limit": 2,
            },
            {
                "key": "school",
                "name": "Escuela",
                "price": f"USD {school_price_cents() / 100:.2f} / 30 dias",
                "student_limit": 300,
                "teacher_limit": 999,
            },
            {
                "key": "enterprise",
                "name": "Gobierno / Red educativa",
                "price": "A medida",
                "student_limit": None,
                "teacher_limit": None,
            },
        ]
    }


@app.post("/api/institutions/{institution_id}/billing/checkout")
def create_billing_checkout(
    institution_id: str,
    payload: BillingCheckoutRequest,
    request: Request,
    current: dict = Depends(get_current_session),
):
    authorize(current, {"institution"}, institution_id=institution_id)
    enforce_rate_limit(request, "billing-checkout", 8, 10 * 60)
    if not billing_is_configured():
        raise HTTPException(status_code=503, detail="Los pagos todavia no estan configurados.")

    plan_key = payload.plan_key.strip().lower()
    country = payload.country.strip().upper()
    if plan_key != "school":
        raise HTTPException(status_code=400, detail="Ese plan requiere coordinacion comercial.")
    if not country.isalpha() or len(country) != 2:
        raise HTTPException(status_code=400, detail="Selecciona un pais valido.")

    with db_session() as session:
        institution = session.get(Institution, institution_id)
        if not institution or not institution.subscription:
            raise HTTPException(status_code=404, detail="Institution not found")

        existing = session.scalar(
            select(BillingPayment)
            .where(
                BillingPayment.institution_id == institution_id,
                BillingPayment.status.in_(["created", "pending"]),
                BillingPayment.created_at > datetime.now(timezone.utc) - timedelta(hours=24),
            )
            .order_by(BillingPayment.created_at.desc())
            .limit(1)
        )
        if existing and existing.checkout_url:
            return {
                "ok": True,
                "checkout_url": existing.checkout_url,
                "payment": billing_payment_payload(existing),
            }

        amount_cents = school_price_cents()
        payment = BillingPayment(
            id=unique_id(session, BillingPayment, "pay", f"{institution_id}-{secrets.token_hex(8)}"),
            institution_id=institution_id,
            plan_key="school",
            status="created",
            amount_cents=amount_cents,
            currency="USD",
            country=country,
        )
        session.add(payment)
        session.flush()

        provider_payment = dlocal_request(
            "POST",
            "/v1/payments",
            {
                "currency": payment.currency,
                "amount": payment.amount_cents / 100,
                "country": payment.country,
                "order_id": payment.id,
                "description": "Yo Aprendo - Plan Escuela por 30 dias",
                "payer": {
                    "id": institution.id,
                    "name": institution.teacher_name or institution.name,
                    "email": institution.subscription.billing_email or institution.teacher_email,
                    "user_reference": institution.id,
                },
                "success_url": f"{PUBLIC_APP_URL}/producto?billing=success",
                "back_url": f"{PUBLIC_APP_URL}/producto?billing=cancelled",
                "notification_url": f"{PUBLIC_APP_URL}/api/billing/dlocal/webhook",
                "expiration_type": "HOURS",
                "expiration_value": 24,
            },
        )

        provider_id = str(provider_payment.get("id", "")).strip()
        checkout_url = str(provider_payment.get("redirect_url", "")).strip()
        if not provider_id or not valid_dlocal_checkout_url(checkout_url):
            raise HTTPException(status_code=502, detail="El proveedor no devolvio un checkout seguro.")
        payment.provider_payment_id = provider_id
        payment.checkout_url = checkout_url
        apply_dlocal_payment_status(session, payment, provider_payment)

        return {
            "ok": True,
            "checkout_url": checkout_url,
            "payment": billing_payment_payload(payment),
        }


@app.get("/api/institutions/{institution_id}/billing/status")
def get_billing_status(
    institution_id: str,
    request: Request,
    current: dict = Depends(get_current_session),
):
    authorize(current, {"institution"}, institution_id=institution_id)
    enforce_rate_limit(request, "billing-status", 30, 60)
    with db_session() as session:
        institution = session.get(Institution, institution_id)
        if not institution:
            raise HTTPException(status_code=404, detail="Institution not found")
        payment = latest_billing_payment(session, institution_id)
        if payment and payment.provider_payment_id and payment.status in {"created", "pending"}:
            provider_payment = dlocal_request("GET", f"/v1/payments/{payment.provider_payment_id}")
            apply_dlocal_payment_status(session, payment, provider_payment)
        students = sum(len(classroom.students) for classroom in institution.classrooms)
        return {
            "ok": True,
            "subscription": subscription_payload(session, institution, students, len(institution.teachers)),
        }


@app.post("/api/billing/dlocal/webhook")
async def dlocal_billing_webhook(request: Request):
    content_length = request.headers.get("content-length", "0")
    if content_length.isdigit() and int(content_length) > 4096:
        raise HTTPException(status_code=413, detail="Payload demasiado grande.")
    raw_body = await request.body()
    if not raw_body or len(raw_body) > 4096:
        raise HTTPException(status_code=400, detail="Notificacion invalida.")

    provided_header = request.headers.get("authorization", "")
    prefix = "V2-HMAC-SHA256, Signature:"
    if not provided_header.startswith(prefix):
        raise HTTPException(status_code=401, detail="Firma invalida.")
    provided_signature = provided_header[len(prefix):].strip().lower()
    expected_signature = hmac.new(
        DLOCAL_SECRET_KEY.encode("utf-8"),
        DLOCAL_API_KEY.encode("utf-8") + raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not DLOCAL_API_KEY or not DLOCAL_SECRET_KEY or not hmac.compare_digest(
        expected_signature,
        provided_signature,
    ):
        raise HTTPException(status_code=401, detail="Firma invalida.")

    try:
        notification = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Notificacion invalida.") from exc
    provider_payment_id = str(notification.get("payment_id", "")).strip()
    if not provider_payment_id or len(provider_payment_id) > 160:
        raise HTTPException(status_code=400, detail="Notificacion invalida.")

    with db_session() as session:
        payment = session.scalar(
            select(BillingPayment).where(BillingPayment.provider_payment_id == provider_payment_id)
        )
        if not payment:
            return {"ok": True}
        provider_payment = dlocal_request("GET", f"/v1/payments/{provider_payment_id}")
        apply_dlocal_payment_status(session, payment, provider_payment)
        return {"ok": True}


@app.post("/api/institutions/register")
def register_institution(payload: InstitutionRegisterRequest, request: Request, response: Response):
    enforce_rate_limit(request, "institution-register", 5, 60 * 60)
    with db_session() as session:
        institution_code = payload.institution_code.strip()
        admin_email = payload.admin_email.strip().lower()
        admin_access_code = payload.admin_access_code.strip()

        if session.scalar(select(Institution).where(Institution.code == institution_code)):
            raise HTTPException(status_code=409, detail="No pudimos registrar esos datos.")
        if session.scalar(select(InstitutionUser).where(InstitutionUser.email == admin_email)):
            raise HTTPException(status_code=409, detail="No pudimos registrar esos datos.")
        if session.scalar(
            select(AuthCredential).where(
                AuthCredential.credential_lookup == credential_lookup(admin_access_code)
            )
        ):
            raise HTTPException(status_code=409, detail="No pudimos registrar esos datos.")

        institution_id = unique_id(session, Institution, "inst", payload.institution_name)
        institution = Institution(
            id=institution_id,
            name=payload.institution_name.strip(),
            code=institution_code,
            teacher_name=payload.admin_name.strip(),
            teacher_email=admin_email,
            notes=f"Departamento: {payload.department.strip()}" if payload.department.strip() else "",
        )
        session.add(institution)
        session.flush()

        subscription = default_subscription(institution_id, payload.billing_email.strip() or admin_email)
        session.add(subscription)
        session.add(
            InstitutionUser(
                id=unique_id(session, InstitutionUser, "user", payload.admin_name),
                institution_id=institution_id,
                role="institution_admin",
                name=payload.admin_name.strip(),
                email=admin_email,
                access_code=f"protected-{secrets.token_urlsafe(18)}",
            )
        )
        create_credential(
            session,
            "institution",
            institution_id,
            admin_access_code,
            admin_email,
            institution_id,
        )
        session.flush()

        result = {
            "ok": True,
            "session": {
                "role": "institution",
                "display_name": institution.name,
                "entity_id": institution.id,
                "redirect_view": "dashboard",
                "institution_id": institution.id,
                "context": {"admin_name": payload.admin_name.strip(), "plan": "trial"},
            },
            "subscription": subscription_payload(session, institution, 0, 0),
        }
        set_session_cookie(
            response,
            session_payload("institution", institution.id, institution.name, institution.id),
        )
        return result


@app.post("/api/institutions/plan-request")
def request_institution_plan(payload: InstitutionPlanRequestRequest, request: Request):
    enforce_rate_limit(request, "plan-request", 10, 60 * 60)
    with db_session() as session:
        plan_key = payload.plan_key.strip().lower()
        if plan_key not in {"school", "enterprise"}:
            plan_key = "school"

        contact_email = payload.email.strip().lower()
        institution_name = payload.institution_name.strip()
        existing = session.scalar(
            select(InstitutionLead).where(
                InstitutionLead.email == contact_email,
                InstitutionLead.institution_name == institution_name,
            )
        )
        if existing:
            existing.plan_key = plan_key
            existing.contact_name = payload.contact_name.strip()
            existing.student_count = payload.student_count.strip()
            existing.status = "new"
            existing.created_at = datetime.now(timezone.utc)
            session.flush()
            return {
                "ok": True,
                "lead": {
                    "id": existing.id,
                    "name": existing.institution_name,
                    "plan": plan_key,
                    "status": "new",
                },
            }

        lead = InstitutionLead(
            id=unique_id(session, InstitutionLead, "lead", institution_name),
            institution_name=institution_name,
            contact_name=payload.contact_name.strip(),
            email=contact_email,
            student_count=payload.student_count.strip(),
            plan_key=plan_key,
            status="new",
        )
        session.add(lead)
        session.flush()

        return {
            "ok": True,
            "lead": {
                "id": lead.id,
                "name": lead.institution_name,
                "plan": plan_key,
                "status": "new",
            },
        }


@app.post("/api/access/login")
def access_login(payload: LoginRequest, request: Request, response: Response):
    enforce_rate_limit(request, "login", 10, 5 * 60)
    with db_session() as session:
        result = resolve_login(session, payload)
        token_payload = session_payload(
            result["role"],
            result["entity_id"],
            result["display_name"],
            result.get("institution_id", ""),
        )
        set_session_cookie(response, token_payload)
        return result


@app.get("/api/access/session")
def access_session(current: dict = Depends(get_current_session)):
    return {
        "role": current["role"],
        "entity_id": current["entity_id"],
        "display_name": current["display_name"],
        "institution_id": current.get("institution_id", ""),
    }


@app.post("/api/access/logout")
def access_logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/", secure=IS_PRODUCTION, samesite="lax")
    return {"ok": True}


@app.get("/api/dashboard/student/{student_id}")
def get_student_dashboard(student_id: str, current: dict = Depends(get_current_session)):
    with db_session() as session:
        student = get_student(session, student_id)
        if current.get("role") == "student":
            authorize(current, {"student"}, entity_id=student_id)
        elif current.get("role") in {"teacher", "institution"}:
            authorize(current, {"teacher", "institution"}, institution_id=student.classroom.institution_id)
        else:
            authorize(current, {"owner"})
        if current.get("role") != "owner":
            require_learning_access(session, student.classroom.institution_id)
        return student_dashboard(session, student_id)


@app.get("/api/dashboard/parent/{guardian_id}")
def get_parent_dashboard(guardian_id: str, current: dict = Depends(get_current_session)):
    authorize(current, {"parent"}, entity_id=guardian_id)
    with db_session() as session:
        require_learning_access(session, current.get("institution_id", ""))
        return guardian_dashboard(session, guardian_id)


@app.get("/api/dashboard/institution/{institution_id}")
def get_institution_dashboard(institution_id: str, current: dict = Depends(get_current_session)):
    authorize(current, {"institution"}, institution_id=institution_id)
    with db_session() as session:
        return institution_dashboard(session, institution_id)


@app.get("/api/dashboard/teacher/{teacher_id}")
def get_teacher_dashboard(teacher_id: str, current: dict = Depends(get_current_session)):
    with db_session() as session:
        teacher = session.get(Teacher, teacher_id)
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        if current.get("role") == "teacher":
            authorize(current, {"teacher"}, entity_id=teacher_id)
        else:
            authorize(current, {"institution"}, institution_id=teacher.institution_id)
        if current.get("role") != "owner":
            require_learning_access(session, teacher.institution_id)
        return teacher_dashboard(session, teacher_id)


@app.get("/api/dashboard/owner/{owner_id}")
def get_owner_dashboard(owner_id: str, current: dict = Depends(get_current_session)):
    authorize(current, {"owner"})
    with db_session() as session:
        return owner_dashboard(session)


@app.post("/api/institutions/{institution_id}/classrooms")
def create_classroom(
    institution_id: str,
    payload: ClassroomCreateRequest,
    current: dict = Depends(get_current_session),
):
    authorize(current, {"institution"}, institution_id=institution_id)
    with db_session() as session:
        institution = session.get(Institution, institution_id)
        if not institution:
            raise HTTPException(status_code=404, detail="Institution not found")
        require_learning_access(session, institution_id)

        classroom = Classroom(
            id=unique_id(session, Classroom, "class", payload.name),
            institution_id=institution_id,
            name=payload.name.strip(),
            grade_label=payload.grade_label.strip(),
            group_code=unique_group_code(session, payload.name),
            assigned_worlds=["Secuencias"],
        )
        session.add(classroom)
        session.flush()
        return {"ok": True, "classroom": classroom_summary(classroom)}


@app.post("/api/classrooms/{classroom_id}/students")
def create_student(
    classroom_id: str,
    payload: StudentCreateRequest,
    current: dict = Depends(get_current_session),
):
    with db_session() as session:
        classroom = get_classroom(session, classroom_id)
        authorize(current, {"institution", "teacher"}, institution_id=classroom.institution_id)
        require_learning_access(session, classroom.institution_id)
        if current.get("role") == "teacher":
            teacher = session.get(Teacher, current["entity_id"])
            if not teacher or classroom not in teacher.classrooms:
                raise HTTPException(status_code=403, detail="No tienes acceso a este grupo.")
        subscription = classroom.institution.subscription
        current_students = sum(len(item.students) for item in classroom.institution.classrooms)
        if subscription and subscription.plan_key != "enterprise" and current_students >= subscription.student_limit:
            raise HTTPException(
                status_code=402,
                detail="El plan actual alcanzo el limite de alumnos. Actualiza el plan para sumar mas estudiantes.",
            )
        student_name = payload.name.strip()
        access_code = payload.student_code.strip() or secrets.token_urlsafe(8)
        student = Student(
            id=unique_id(session, Student, "stu", student_name),
            classroom_id=classroom.id,
            name=student_name,
            display_name=payload.display_name.strip() or student_name,
            avatar="Nuevo tripulante",
            student_code=f"protected-{secrets.token_urlsafe(12)}",
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
        create_credential(
            session,
            "student",
            student.id,
            access_code,
            student.name,
            classroom.institution_id,
        )
        session.flush()
        return {"ok": True, "student": student_summary(student), "access_code": access_code}


@app.post("/api/students/{student_id}/guardians")
def link_guardian(
    student_id: str,
    payload: GuardianLinkRequest,
    current: dict = Depends(get_current_session),
):
    with db_session() as session:
        student = get_student(session, student_id)
        authorize(current, {"institution", "teacher"}, institution_id=student.classroom.institution_id)
        require_learning_access(session, student.classroom.institution_id)
        if current.get("role") == "teacher":
            teacher = session.get(Teacher, current["entity_id"])
            if not teacher or student.classroom not in teacher.classrooms:
                raise HTTPException(status_code=403, detail="No tienes acceso a este alumno.")
        guardian_code = payload.guardian_code.strip()
        existing_credential = find_credential(session, "parent", guardian_code)
        guardian = session.get(Guardian, existing_credential.entity_id) if existing_credential else None

        if guardian is None:
            guardian_name = payload.guardian_name.strip()
            guardian = Guardian(
                id=unique_id(session, Guardian, "guardian", guardian_name),
                name=guardian_name,
                code=f"protected-{secrets.token_urlsafe(12)}",
                contact=payload.contact.strip(),
            )
            session.add(guardian)
            session.flush()
            create_credential(
                session,
                "parent",
                guardian.id,
                guardian_code,
                guardian_name,
                student.classroom.institution_id,
            )
        elif existing_credential and existing_credential.institution_id != student.classroom.institution_id:
            raise HTTPException(status_code=409, detail="Ese acceso familiar pertenece a otra institucion.")

        if student not in guardian.students:
            guardian.students.append(student)

        session.flush()
        return {"ok": True, "guardian": guardian_payload(guardian), "access_code": guardian_code}
