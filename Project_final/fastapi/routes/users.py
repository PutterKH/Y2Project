from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import *

router = APIRouter()

# Pydantic model for user creation
class UserCreate(BaseModel):
    username: str
    password: str
    email: str
class UserLogin(BaseModel):
    username: str
    password: str
# Pydantic model for user update
class UserUpdate(BaseModel):
    username: Optional[str]
    password: Optional[str]
    email: Optional[str]

# Pydantic model for user response
class User(BaseModel):
    user_id: int
    username: str
    password: str
    email: str
    created_at: datetime


# Endpoint to create a new user
@router.post("/register/", response_model=User)
async def create_user(user: UserCreate):
    result = await insert_user(user.username, user.password, user.email)
    if result is None:
        raise HTTPException(status_code=400, detail="Error creating user")
    return result

# Endpoint to get a user by user_id
@router.get("/users/{user_id}", response_model=User)
async def read_user(user_id: int):
    result = await get_user(user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return result

# Endpoint to update a user
@router.put("/users/{user_id}", response_model=User)
async def update_user_endpoint(user_id: int, user: UserUpdate):
    result = await update_user(user_id, user.username, user.password, user.email)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return result

# Endpoint to delete a user
@router.delete("/users/{user_id}")
async def delete_user_endpoint(user_id: int):
    result = await delete_user(user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted"}
# Login endpoint
@router.post("/login/")
async def login(user: UserLogin):
    query = "SELECT * FROM users WHERE username = :username"
    db_user = await database.fetch_one(query, {"username": user.username})

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if user.password != db_user["password"]:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"message": "Login successful", "user_id": db_user["user_id"], "username": db_user["username"]}
