from typing import Union
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import *
from routes.users import router as users_router
from routes.stock import router as stock_router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True, 
        allow_methods=["*"],     
        allow_headers=["*"],    
)

app.include_router(users_router, prefix="/api")
app.include_router(stock_router)

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()
