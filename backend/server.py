from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import pandas as pd
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    role: str = "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Agent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    mobile: str
    role: str = "agent"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Assignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    agent_name: str
    first_name: str
    phone: str
    notes: str
    upload_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Upload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    total_records: int
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Input Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class AgentCreate(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    password: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Auth Routes
@api_router.post("/auth/register-admin")
async def register_admin(admin_data: AdminCreate):
    # Check if admin exists
    existing = await db.admins.find_one({"email": admin_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    admin = Admin(
        name=admin_data.name,
        email=admin_data.email
    )
    
    doc = admin.model_dump()
    doc['password_hash'] = hash_password(admin_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.admins.insert_one(doc)
    
    token = create_token(admin.id, admin.email, admin.role)
    return {"token": token, "user": admin, "message": "Admin registered successfully"}

@api_router.post("/auth/login")
async def login(login_data: LoginRequest):
    # Check admin
    user = await db.admins.find_one({"email": login_data.email})
    if not user:
        # Check agent
        user = await db.agents.find_one({"email": login_data.email})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'], user['role'])
    
    user_data = {
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "role": user['role']
    }
    
    return {"token": token, "user": user_data}

# Agent Routes
@api_router.post("/agents", response_model=Agent)
async def create_agent(agent_data: AgentCreate, current_user: dict = Depends(require_admin)):
    # Check if agent exists
    existing = await db.agents.find_one({"email": agent_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Agent with this email already exists")
    
    agent = Agent(
        name=agent_data.name,
        email=agent_data.email,
        mobile=agent_data.mobile
    )
    
    doc = agent.model_dump()
    doc['password_hash'] = hash_password(agent_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.agents.insert_one(doc)
    return agent

@api_router.get("/agents", response_model=List[Agent])
async def get_agents(current_user: dict = Depends(require_admin)):
    agents = await db.agents.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for agent in agents:
        if isinstance(agent['created_at'], str):
            agent['created_at'] = datetime.fromisoformat(agent['created_at'])
    
    return agents

@api_router.put("/agents/{agent_id}")
async def update_agent(agent_id: str, agent_data: AgentUpdate, current_user: dict = Depends(require_admin)):
    agent = await db.agents.find_one({"id": agent_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    update_data = {k: v for k, v in agent_data.model_dump().items() if v is not None}
    
    if 'password' in update_data:
        update_data['password_hash'] = hash_password(update_data['password'])
        del update_data['password']
    
    if update_data:
        await db.agents.update_one({"id": agent_id}, {"$set": update_data})
    
    return {"message": "Agent updated successfully"}

@api_router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, current_user: dict = Depends(require_admin)):
    result = await db.agents.delete_one({"id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Also delete assignments
    await db.assignments.delete_many({"agent_id": agent_id})
    
    return {"message": "Agent deleted successfully"}

# Upload & Distribution Routes
@api_router.post("/uploads")
async def upload_and_distribute(file: UploadFile = File(...), current_user: dict = Depends(require_admin)):
    # Validate file type
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV, XLSX, and XLS files are allowed")
    
    # Read file
    contents = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Validate columns
    required_columns = ['FirstName', 'Phone', 'Notes']
    if not all(col in df.columns for col in required_columns):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {', '.join(required_columns)}"
        )
    
    # Get all agents
    agents = await db.agents.find({}, {"_id": 0}).to_list(1000)
    if not agents:
        raise HTTPException(status_code=400, detail="No agents available for distribution")
    
    # Create upload record
    upload = Upload(
        filename=file.filename,
        total_records=len(df),
        uploaded_by=current_user['email']
    )
    
    upload_doc = upload.model_dump()
    upload_doc['uploaded_at'] = upload_doc['uploaded_at'].isoformat()
    await db.uploads.insert_one(upload_doc)
    
    # Distribute records among agents
    assignments = []
    agent_count = len(agents)
    
    for idx, row in df.iterrows():
        agent = agents[idx % agent_count]
        
        assignment = Assignment(
            agent_id=agent['id'],
            agent_name=agent['name'],
            first_name=str(row['FirstName']),
            phone=str(row['Phone']),
            notes=str(row['Notes']),
            upload_id=upload.id
        )
        
        assignment_doc = assignment.model_dump()
        assignment_doc['created_at'] = assignment_doc['created_at'].isoformat()
        assignments.append(assignment_doc)
    
    if assignments:
        await db.assignments.insert_many(assignments)
    
    return {
        "message": "File uploaded and distributed successfully",
        "upload_id": upload.id,
        "total_records": len(df),
        "agents_count": agent_count
    }

@api_router.get("/uploads", response_model=List[Upload])
async def get_uploads(current_user: dict = Depends(require_admin)):
    uploads = await db.uploads.find({}, {"_id": 0}).sort("uploaded_at", -1).to_list(1000)
    
    for upload in uploads:
        if isinstance(upload['uploaded_at'], str):
            upload['uploaded_at'] = datetime.fromisoformat(upload['uploaded_at'])
    
    return uploads

@api_router.get("/assignments")
async def get_assignments(current_user: dict = Depends(get_current_user)):
    query = {}
    
    # If agent, filter by agent_id
    if current_user['role'] == 'agent':
        query['agent_id'] = current_user['user_id']
    
    assignments = await db.assignments.find(query, {"_id": 0}).to_list(10000)
    
    for assignment in assignments:
        if isinstance(assignment['created_at'], str):
            assignment['created_at'] = datetime.fromisoformat(assignment['created_at'])
    
    return assignments

@api_router.get("/assignments/stats")
async def get_assignment_stats(current_user: dict = Depends(require_admin)):
    # Get agents with their assignment counts
    agents = await db.agents.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    stats = []
    for agent in agents:
        count = await db.assignments.count_documents({"agent_id": agent['id']})
        stats.append({
            "agent_id": agent['id'],
            "agent_name": agent['name'],
            "agent_email": agent['email'],
            "assignments_count": count
        })
    
    return stats

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