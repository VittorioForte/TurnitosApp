from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import resend
import asyncio
import mercadopago

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Turnitos API")
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

MERCADOPAGO_ACCESS_TOKEN = os.environ.get('MERCADOPAGO_ACCESS_TOKEN', '')
SUBSCRIPTION_PRICE = float(os.environ.get('SUBSCRIPTION_PRICE', '11999'))

if MERCADOPAGO_ACCESS_TOKEN:
    sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)
else:
    sdk = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    business_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: EmailStr
    business_name: str
    trial_ends: datetime
    subscription_active: bool
    subscription_ends: Optional[datetime] = None
    created_at: datetime

class ServiceCreate(BaseModel):
    name: str
    description: str
    duration_minutes: int
    price: float

class Service(BaseModel):
    service_id: str
    user_id: str
    name: str
    description: str
    duration_minutes: int
    price: float
    active: bool = True

class BusinessHoursUpdate(BaseModel):
    day_of_week: int
    is_open: bool
    open_time: Optional[str] = None
    close_time: Optional[str] = None

class ClosedDateCreate(BaseModel):
    date: str

class ClosedDate(BaseModel):
    user_id: str
    date: str
    reason: Optional[str] = None

class BugReport(BaseModel):
    name: str
    email: EmailStr
    category: str
    subject: str
    description: str
    url: str

class CustomSlugUpdate(BaseModel):
    custom_slug: str

class AppointmentCreate(BaseModel):
    service_id: str
    client_name: str
    client_phone: str
    client_email: EmailStr
    date: str
    time: str

class Appointment(BaseModel):
    appointment_id: str
    user_id: str
    service_id: str
    service_name: str
    client_name: str
    client_phone: str
    client_email: EmailStr
    date: str
    time: str
    status: str
    created_at: datetime

class DashboardStats(BaseModel):
    total_appointments: int
    pending_appointments: int
    total_services: int
    trial_days_left: int

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def check_subscription(user: dict):
    trial_ends = user['trial_ends']
    if isinstance(trial_ends, str):
        trial_ends = datetime.fromisoformat(trial_ends)
    
    if user['subscription_active']:
        if user.get('subscription_ends'):
            sub_ends = user['subscription_ends']
            if isinstance(sub_ends, str):
                sub_ends = datetime.fromisoformat(sub_ends)
            if datetime.now(timezone.utc) > sub_ends:
                raise HTTPException(status_code=403, detail="Suscripción expirada")
    else:
        if datetime.now(timezone.utc) > trial_ends:
            raise HTTPException(status_code=403, detail="Prueba gratuita expirada")

async def send_email_async(recipient: str, subject: str, html: str):
    if not RESEND_API_KEY:
        logging.warning("RESEND_API_KEY no configurada, email no enviado")
        return
    
    try:
        params = {
            "from": "Turnitos <onboarding@resend.dev>",
            "to": [recipient],
            "subject": subject,
            "html": html
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Email enviado a {recipient}")
    except Exception as e:
        logging.error(f"Error enviando email: {str(e)}")

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    user_id = str(uuid.uuid4())
    hashed_password = pwd_context.hash(user_data.password)
    trial_ends = datetime.now(timezone.utc) + timedelta(days=7)
    
    user = {
        "user_id": user_id,
        "email": user_data.email,
        "password_hash": hashed_password,
        "business_name": user_data.business_name,
        "trial_ends": trial_ends.isoformat(),
        "subscription_active": False,
        "subscription_ends": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    for day in range(7):
        await db.business_hours.insert_one({
            "user_id": user_id,
            "day_of_week": day,
            "is_open": day < 5,
            "open_time": "09:00" if day < 5 else None,
            "close_time": "18:00" if day < 5 else None
        })
    
    token = create_access_token({"sub": user_id})
    
    return {
        "token": token,
        "user": {
            "user_id": user_id,
            "email": user_data.email,
            "business_name": user_data.business_name,
            "trial_ends": trial_ends.isoformat()
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not pwd_context.verify(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_access_token({"sub": user['user_id']})
    
    return {
        "token": token,
        "user": {
            "user_id": user['user_id'],
            "email": user['email'],
            "business_name": user['business_name'],
            "trial_ends": user['trial_ends'],
            "subscription_active": user['subscription_active']
        }
    }

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    
    total_appointments = await db.appointments.count_documents({"user_id": current_user['user_id']})
    pending_appointments = await db.appointments.count_documents({
        "user_id": current_user['user_id'],
        "status": "pending"
    })
    total_services = await db.services.count_documents({
        "user_id": current_user['user_id'],
        "active": True
    })
    
    trial_ends = current_user['trial_ends']
    if isinstance(trial_ends, str):
        trial_ends = datetime.fromisoformat(trial_ends)
    
    trial_days_left = max(0, (trial_ends - datetime.now(timezone.utc)).days)
    
    return {
        "total_appointments": total_appointments,
        "pending_appointments": pending_appointments,
        "total_services": total_services,
        "trial_days_left": trial_days_left
    }

@api_router.get("/services", response_model=List[Service])
async def get_services(current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    services = await db.services.find({"user_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    return services

@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    
    service = {
        "service_id": str(uuid.uuid4()),
        "user_id": current_user['user_id'],
        "name": service_data.name,
        "description": service_data.description,
        "duration_minutes": service_data.duration_minutes,
        "price": service_data.price,
        "active": True
    }
    
    await db.services.insert_one(service)
    return service

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_data: ServiceCreate, current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    
    result = await db.services.find_one_and_update(
        {"service_id": service_id, "user_id": current_user['user_id']},
        {"$set": service_data.model_dump()},
        return_document=True,
        projection={"_id": 0}
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    return result

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    
    result = await db.services.update_one(
        {"service_id": service_id, "user_id": current_user['user_id']},
        {"$set": {"active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    return {"message": "Servicio desactivado"}

@api_router.get("/business-hours")
async def get_business_hours(current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    hours = await db.business_hours.find({"user_id": current_user['user_id']}, {"_id": 0}).to_list(7)
    return sorted(hours, key=lambda x: x['day_of_week'])

@api_router.put("/business-hours")
async def update_business_hours(hours_list: List[BusinessHoursUpdate], current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    
    # Usar bulk_write para optimizar las actualizaciones
    from pymongo import UpdateOne
    
    operations = [
        UpdateOne(
            {"user_id": current_user['user_id'], "day_of_week": hours.day_of_week},
            {"$set": {
                "is_open": hours.is_open,
                "open_time": hours.open_time,
                "close_time": hours.close_time
            }}
        )
        for hours in hours_list
    ]
    
    if operations:
        await db.business_hours.bulk_write(operations)
    
    return {"message": "Horarios actualizados"}

@api_router.get("/closed-dates")
async def get_closed_dates(current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    closed_dates = await db.closed_dates.find({"user_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    return closed_dates

@api_router.post("/closed-dates")
async def create_closed_date(closed_date: ClosedDateCreate, current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    
    existing = await db.closed_dates.find_one({
        "user_id": current_user['user_id'],
        "date": closed_date.date
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Esta fecha ya está marcada como cerrada")
    
    await db.closed_dates.insert_one({
        "user_id": current_user['user_id'],
        "date": closed_date.date
    })
    
    return {"message": "Día cerrado agregado"}

@api_router.delete("/closed-dates/{date}")
async def delete_closed_date(date: str, current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    
    result = await db.closed_dates.delete_one({
        "user_id": current_user['user_id'],
        "date": date
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fecha no encontrada")
    
    return {"message": "Día cerrado eliminado"}

@api_router.get("/appointments")
async def get_appointments(current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    appointments = await db.appointments.find({
        "user_id": current_user['user_id'],
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(1000)
    return sorted(appointments, key=lambda x: (x['date'], x['time']), reverse=True)

@api_router.post("/appointments/admin")
async def create_appointment_admin(appt_data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    
    service = await db.services.find_one({"service_id": appt_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Verificar disponibilidad considerando la duración del servicio
    service_duration = service.get('duration_minutes', 30)
    proposed_start = datetime.strptime(appt_data.time, "%H:%M")
    proposed_end = proposed_start + timedelta(minutes=service_duration)
    
    # Obtener todos los turnos del día
    existing_appointments = await db.appointments.find({
        "user_id": current_user['user_id'],
        "date": appt_data.date,
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(100)
    
    # Verificar solapamiento
    for existing in existing_appointments:
        existing_service = await db.services.find_one({"service_id": existing["service_id"]}, {"_id": 0})
        if existing_service:
            existing_duration = existing_service.get('duration_minutes', 30)
            existing_start = datetime.strptime(existing["time"], "%H:%M")
            existing_end = existing_start + timedelta(minutes=existing_duration)
            
            # Verificar solapamiento
            if (existing_start <= proposed_start < existing_end or
                existing_start < proposed_end <= existing_end or
                (proposed_start <= existing_start and proposed_end >= existing_end)):
                raise HTTPException(status_code=400, detail="Este horario se solapa con otro turno existente")
    
    appointment = {
        "appointment_id": str(uuid.uuid4()),
        "user_id": current_user['user_id'],
        "service_id": appt_data.service_id,
        "service_name": service['name'],
        "service_duration": service_duration,
        "client_name": appt_data.client_name,
        "client_phone": appt_data.client_phone,
        "client_email": appt_data.client_email,
        "date": appt_data.date,
        "time": appt_data.time,
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.appointments.insert_one(appointment)
    # Return appointment without MongoDB's _id field
    return {k: v for k, v in appointment.items() if k != '_id'}

@api_router.delete("/appointments/{appointment_id}")
async def cancel_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    await check_subscription(current_user)
    
    result = await db.appointments.update_one(
        {"appointment_id": appointment_id, "user_id": current_user['user_id']},
        {"$set": {"status": "cancelled"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    return {"message": "Turno cancelado"}

@api_router.get("/public/{slug}/info")
async def get_public_info(slug: str):
    # Intentar primero por custom_slug, luego por user_id
    user = await db.users.find_one({"custom_slug": slug}, {"_id": 0, "password_hash": 0})
    if not user:
        user = await db.users.find_one({"user_id": slug}, {"_id": 0, "password_hash": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    # Verificar si el usuario tiene acceso activo
    trial_ends = user['trial_ends']
    if isinstance(trial_ends, str):
        trial_ends = datetime.fromisoformat(trial_ends)
    
    # Si la suscripción está activa, verificar si no ha expirado
    if user.get('subscription_active'):
        sub_ends = user.get('subscription_ends')
        if sub_ends:
            if isinstance(sub_ends, str):
                sub_ends = datetime.fromisoformat(sub_ends)
            if datetime.now(timezone.utc) > sub_ends:
                # Suscripción expirada
                raise HTTPException(status_code=403, detail="La suscripción de este negocio ha expirado")
    else:
        # No tiene suscripción, verificar trial
        if datetime.now(timezone.utc) > trial_ends:
            raise HTTPException(status_code=403, detail="El período de prueba de este negocio ha expirado")
    
    user_id = user['user_id']
    services = await db.services.find({"user_id": user_id, "active": True}, {"_id": 0}).to_list(1000)
    hours = await db.business_hours.find({"user_id": user_id}, {"_id": 0}).to_list(7)
    
    return {
        "business_name": user['business_name'],
        "services": services,
        "business_hours": sorted(hours, key=lambda x: x['day_of_week'])
    }

@api_router.get("/public/{slug}/available-slots")
async def get_available_slots(slug: str, service_id: str, date: str):
    # Obtener user_id desde slug
    user = await db.users.find_one({"custom_slug": slug}, {"_id": 0})
    if not user:
        user = await db.users.find_one({"user_id": slug}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    user_id = user['user_id']
    service = await db.services.find_one({"service_id": service_id, "user_id": user_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Verificar si la fecha está en días cerrados
    is_closed = await db.closed_dates.find_one({
        "user_id": user_id,
        "date": date
    })
    
    if is_closed:
        return {"slots": [], "message": "Día cerrado"}
    
    date_obj = datetime.strptime(date, "%Y-%m-%d")
    day_of_week = date_obj.weekday()
    
    business_hours = await db.business_hours.find_one({
        "user_id": user_id,
        "day_of_week": day_of_week
    }, {"_id": 0})
    
    if not business_hours or not business_hours['is_open']:
        return {"slots": []}
    
    # Obtener TODOS los turnos del día (no cancelados) con su duración
    existing_appointments = await db.appointments.find({
        "user_id": user_id,
        "date": date,
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(100)
    
    # Construir lista de rangos ocupados
    occupied_ranges = []
    for appt in existing_appointments:
        # Obtener la duración del servicio del turno
        appt_service = await db.services.find_one({"service_id": appt["service_id"]}, {"_id": 0})
        if appt_service:
            duration = appt_service.get("duration_minutes", 30)
            start_time = datetime.strptime(appt["time"], "%H:%M")
            end_time = start_time + timedelta(minutes=duration)
            occupied_ranges.append({
                "start": start_time,
                "end": end_time
            })
    
    open_time = business_hours['open_time']
    close_time = business_hours['close_time']
    service_duration = service.get('duration_minutes', 30)
    
    slots = []
    current_time = datetime.strptime(open_time, "%H:%M")
    end_time = datetime.strptime(close_time, "%H:%M")
    
    # Generar slots cada 15 minutos para mayor flexibilidad
    slot_interval = 15
    
    while current_time < end_time:
        # Calcular el rango que ocuparía este turno
        proposed_start = current_time
        proposed_end = current_time + timedelta(minutes=service_duration)
        
        # Verificar que el turno termine antes del cierre
        if proposed_end > end_time:
            break
        
        # Verificar si este slot se superpone con algún turno existente
        is_available = True
        for occupied in occupied_ranges:
            # Hay conflicto si:
            # - El inicio propuesto está entre un turno ocupado
            # - El fin propuesto está entre un turno ocupado
            # - El turno propuesto envuelve completamente un turno ocupado
            if (occupied["start"] <= proposed_start < occupied["end"] or
                occupied["start"] < proposed_end <= occupied["end"] or
                (proposed_start <= occupied["start"] and proposed_end >= occupied["end"])):
                is_available = False
                break
        
        if is_available:
            slots.append(current_time.strftime("%H:%M"))
        
        current_time += timedelta(minutes=slot_interval)
    
    return {"slots": slots}

@api_router.post("/public/{slug}/appointments")
async def create_public_appointment(slug: str, appt_data: AppointmentCreate):
    # Obtener user_id desde slug
    user = await db.users.find_one({"custom_slug": slug}, {"_id": 0})
    if not user:
        user = await db.users.find_one({"user_id": slug}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    user_id = user['user_id']
    service = await db.services.find_one({"service_id": appt_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Verificar disponibilidad considerando la duración del servicio
    service_duration = service.get('duration_minutes', 30)
    proposed_start = datetime.strptime(appt_data.time, "%H:%M")
    proposed_end = proposed_start + timedelta(minutes=service_duration)
    
    # Obtener todos los turnos del día
    existing_appointments = await db.appointments.find({
        "user_id": user_id,
        "date": appt_data.date,
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(100)
    
    # Verificar solapamiento
    for existing in existing_appointments:
        existing_service = await db.services.find_one({"service_id": existing["service_id"]}, {"_id": 0})
        if existing_service:
            existing_duration = existing_service.get('duration_minutes', 30)
            existing_start = datetime.strptime(existing["time"], "%H:%M")
            existing_end = existing_start + timedelta(minutes=existing_duration)
            
            # Verificar solapamiento
            if (existing_start <= proposed_start < existing_end or
                existing_start < proposed_end <= existing_end or
                (proposed_start <= existing_start and proposed_end >= existing_end)):
                raise HTTPException(status_code=400, detail="Este horario ya está reservado o se solapa con otro turno")
    
    appointment = {
        "appointment_id": str(uuid.uuid4()),
        "user_id": user_id,
        "service_id": appt_data.service_id,
        "service_name": service['name'],
        "service_duration": service_duration,  # Guardar duración para futuras consultas
        "client_name": appt_data.client_name,
        "client_phone": appt_data.client_phone,
        "client_email": appt_data.client_email,
        "date": appt_data.date,
        "time": appt_data.time,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.appointments.insert_one(appointment)
    
    client_html = f"""
    <h2>¡Turno Confirmado!</h2>
    <p>Hola {appt_data.client_name},</p>
    <p>Tu turno ha sido confirmado:</p>
    <ul>
        <li><strong>Servicio:</strong> {service['name']}</li>
        <li><strong>Duración:</strong> {service_duration} minutos</li>
        <li><strong>Fecha:</strong> {appt_data.date}</li>
        <li><strong>Hora:</strong> {appt_data.time}</li>
        <li><strong>Negocio:</strong> {user['business_name']}</li>
    </ul>
    <p>Gracias por tu reserva.</p>
    """
    
    owner_html = f"""
    <h2>Nuevo Turno Reservado</h2>
    <p>Se ha registrado un nuevo turno:</p>
    <ul>
        <li><strong>Cliente:</strong> {appt_data.client_name}</li>
        <li><strong>Teléfono:</strong> {appt_data.client_phone}</li>
        <li><strong>Servicio:</strong> {service['name']}</li>
        <li><strong>Duración:</strong> {service_duration} minutos</li>
        <li><strong>Fecha:</strong> {appt_data.date}</li>
        <li><strong>Hora:</strong> {appt_data.time}</li>
    </ul>
    """
    
    asyncio.create_task(send_email_async(appt_data.client_email, "Confirmación de turno", client_html))
    asyncio.create_task(send_email_async(user['email'], "Nuevo turno reservado", owner_html))
    
    # Return appointment without MongoDB's _id field
    return {k: v for k, v in appointment.items() if k != '_id'}

@api_router.get("/subscription/status")
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    trial_ends = current_user['trial_ends']
    if isinstance(trial_ends, str):
        trial_ends = datetime.fromisoformat(trial_ends)
    
    trial_days_left = max(0, (trial_ends - datetime.now(timezone.utc)).days)
    
    # Verificar si la suscripción expiró
    if current_user['subscription_active']:
        sub_ends = current_user.get('subscription_ends')
        if sub_ends:
            if isinstance(sub_ends, str):
                sub_ends = datetime.fromisoformat(sub_ends)
            if datetime.now(timezone.utc) > sub_ends:
                # Suscripción expirada, desactivarla
                await db.users.update_one(
                    {"user_id": current_user['user_id']},
                    {"$set": {"subscription_active": False}}
                )
                current_user['subscription_active'] = False
    
    # Calcular días restantes de suscripción
    subscription_days_left = 0
    if current_user['subscription_active'] and current_user.get('subscription_ends'):
        sub_ends = current_user['subscription_ends']
        if isinstance(sub_ends, str):
            sub_ends = datetime.fromisoformat(sub_ends)
        subscription_days_left = max(0, (sub_ends - datetime.now(timezone.utc)).days)
    
    return {
        "subscription_active": current_user['subscription_active'],
        "trial_days_left": trial_days_left,
        "subscription_ends": current_user.get('subscription_ends'),
        "subscription_price": SUBSCRIPTION_PRICE,
        "subscription_days_left": subscription_days_left,
        "show_renewal_warning": subscription_days_left <= 7 and subscription_days_left > 0
    }

@api_router.post("/report-bug")
async def report_bug(bug_report: BugReport, current_user: dict = Depends(get_current_user)):
    try:
        html_content = f"""
        <h2>Nuevo Reporte de Error - Turnitos</h2>
        <p><strong>De:</strong> {bug_report.name} ({bug_report.email})</p>
        <p><strong>Negocio:</strong> {current_user['business_name']}</p>
        <p><strong>Categoría:</strong> {bug_report.category}</p>
        <p><strong>Asunto:</strong> {bug_report.subject}</p>
        <hr>
        <h3>Descripción:</h3>
        <p>{bug_report.description}</p>
        <hr>
        <p><strong>URL:</strong> {bug_report.url}</p>
        <p><strong>User ID:</strong> {current_user['user_id']}</p>
        <p><strong>Fecha:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
        """
        
        if RESEND_API_KEY:
            await asyncio.to_thread(resend.Emails.send, {
                "from": "Turnitos <onboarding@resend.dev>",
                "to": ["sitelab.webdev@gmail.com"],
                "reply_to": bug_report.email,
                "subject": f"[Turnitos Bug] {bug_report.subject}",
                "html": html_content
            })
            return {"message": "Reporte enviado exitosamente"}
        else:
            logging.warning("RESEND_API_KEY no configurada, no se puede enviar el reporte")
            raise HTTPException(status_code=500, detail="Servicio de email no configurado")
    except Exception as e:
        logging.error(f"Error enviando reporte: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al enviar el reporte")

@api_router.get("/user/custom-slug")
async def get_custom_slug(current_user: dict = Depends(get_current_user)):
    return {"custom_slug": current_user.get('custom_slug', current_user['user_id'])}

@api_router.put("/user/custom-slug")
async def update_custom_slug(slug_data: CustomSlugUpdate, current_user: dict = Depends(get_current_user)):
    slug = slug_data.custom_slug.lower().strip()
    
    # Validaciones
    if len(slug) < 3:
        raise HTTPException(status_code=400, detail="El slug debe tener al menos 3 caracteres")
    
    if not slug.replace('-', '').isalnum():
        raise HTTPException(status_code=400, detail="Solo se permiten letras, números y guiones")
    
    # Verificar si ya existe
    existing = await db.users.find_one({
        "custom_slug": slug,
        "user_id": {"$ne": current_user['user_id']}
    })
    
    if existing:
        raise HTTPException(status_code=409, detail="Este slug ya está en uso")
    
    await db.users.update_one(
        {"user_id": current_user['user_id']},
        {"$set": {"custom_slug": slug}}
    )
    
    return {"message": "Slug actualizado", "custom_slug": slug}

@api_router.post("/subscription/create-payment")
async def create_payment(current_user: dict = Depends(get_current_user)):
    if not sdk:
        raise HTTPException(status_code=500, detail="MercadoPago no configurado")
    
    try:
        preference_data = {
            "items": [
                {
                    "title": f"Suscripción Mensual - {current_user['business_name']}",
                    "quantity": 1,
                    "unit_price": SUBSCRIPTION_PRICE,
                    "currency_id": "ARS"
                }
            ],
            "payer": {
                "email": current_user['email'],
                "name": current_user['business_name']
            },
            "back_urls": {
                "success": f"{os.environ['FRONTEND_URL']}/subscription?status=success",
                "failure": f"{os.environ['FRONTEND_URL']}/subscription?status=failure",
                "pending": f"{os.environ['FRONTEND_URL']}/subscription?status=pending"
            },
            "auto_return": "approved",
            "external_reference": current_user['user_id'],
            "notification_url": f"{os.environ['BACKEND_URL']}/api/webhooks/mercadopago"
        }
        
        preference_response = sdk.preference().create(preference_data)
        preference = preference_response["response"]
        
        return {
            "init_point": preference["init_point"],
            "preference_id": preference["id"]
        }
    except Exception as e:
        logging.error(f"Error creando preference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al crear link de pago: {str(e)}")

@api_router.post("/webhooks/mercadopago")
async def mercadopago_webhook(request: Request):
    try:
        body = await request.json()
        logging.info(f"Webhook recibido: {body}")
        
        if body.get("type") == "payment":
            payment_id = body.get("data", {}).get("id")
            
            if not payment_id:
                return {"status": "no payment id"}
            
            if not sdk:
                logging.error("SDK de MercadoPago no configurado")
                return {"status": "sdk not configured"}
            
            payment_info = sdk.payment().get(payment_id)
            payment = payment_info["response"]
            
            logging.info(f"Pago recibido: {payment}")
            
            if payment["status"] == "approved":
                user_id = payment.get("external_reference")
                
                if user_id:
                    subscription_ends = datetime.now(timezone.utc) + timedelta(days=30)
                    
                    await db.users.update_one(
                        {"user_id": user_id},
                        {
                            "$set": {
                                "subscription_active": True,
                                "subscription_ends": subscription_ends.isoformat(),
                                "last_payment_id": payment_id,
                                "last_payment_date": datetime.now(timezone.utc).isoformat(),
                                "last_payment_amount": payment["transaction_amount"]
                            }
                        }
                    )
                    
                    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
                    
                    if user and RESEND_API_KEY:
                        confirmation_html = f"""
                        <h2>¡Pago Confirmado!</h2>
                        <p>Hola {user['business_name']},</p>
                        <p>Tu suscripción ha sido activada exitosamente.</p>
                        <ul>
                            <li><strong>Monto:</strong> ${payment['transaction_amount']}</li>
                            <li><strong>Válida hasta:</strong> {subscription_ends.strftime('%d/%m/%Y')}</li>
                        </ul>
                        <p>¡Gracias por confiar en Turnitos!</p>
                        """
                        asyncio.create_task(send_email_async(
                            user['email'],
                            "Suscripción Activada - Turnitos",
                            confirmation_html
                        ))
                    
                    logging.info(f"Suscripción activada para user {user_id}")
        
        return {"status": "ok"}
    except Exception as e:
        logging.error(f"Error procesando webhook: {str(e)}")
        return {"status": "error", "message": str(e)}

@api_router.get("/subscription/check-payment/{payment_id}")
async def check_payment_status(payment_id: str, current_user: dict = Depends(get_current_user)):
    if not sdk:
        raise HTTPException(status_code=500, detail="MercadoPago no configurado")
    
    try:
        payment_info = sdk.payment().get(payment_id)
        payment = payment_info["response"]
        
        return {
            "status": payment["status"],
            "status_detail": payment.get("status_detail"),
            "external_reference": payment.get("external_reference")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al verificar pago: {str(e)}")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
