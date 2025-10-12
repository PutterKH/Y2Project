from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import *
from passlib.context import CryptContext

# Password hashing context (bcrypt does salting internally)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()

# -------- Helper functions --------
MAX_PW_LENGTH = 72  # bcrypt hard limit

def hash_password(password: str) -> str:
    """Convert plain password into a salted hash (with length check)."""
    if len(password.encode("utf-8")) > MAX_PW_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password too long. Maximum length is {MAX_PW_LENGTH} characters."
        )
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if plain password matches the stored hash"""
    return pwd_context.verify(plain_password, hashed_password)

# -------- Pydantic Models --------
class UserCreate(BaseModel):
    username: str
    password: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str]
    password: Optional[str]
    email: Optional[str]

# ⚠️ Response model without password (don’t expose hash!)
class User(BaseModel):
    user_id: int
    username: str
    email: str
    created_at: datetime

# -------- Endpoints --------

# Register new user (with hashing)
@router.post("/register/", response_model=User)
async def create_user(user: UserCreate):
    hashed_pw = hash_password(user.password)   # hash before insert
    result = await insert_user(user.username, hashed_pw, user.email)
    if result is None:
        raise HTTPException(status_code=400, detail="Error creating user")
    return result

# Get user by id
@router.get("/users/{user_id}", response_model=User)
async def read_user(user_id: int):
    result = await get_user(user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return result

# Update user (rehash if password is updated)
@router.put("/users/{user_id}", response_model=User)
async def update_user_endpoint(user_id: int, user: UserUpdate):
    new_password = hash_password(user.password) if user.password else None
    result = await update_user(user_id, user.username, new_password, user.email)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return result

# Delete user
@router.delete("/users/{user_id}")
async def delete_user_endpoint(user_id: int):
    result = await delete_user(user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted"}

# Login (verify hashed password)
@router.post("/login/")
async def login(user: UserLogin):
    query = "SELECT * FROM users WHERE username = :username"
    db_user = await database.fetch_one(query, {"username": user.username})

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"message": "Login successful", "user_id": db_user["user_id"], "username": db_user["username"]}
