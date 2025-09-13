from typing import Union
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import *
from routes.users import router
from routes.book import router as books_router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True, 
        allow_methods=["*"],     
        allow_headers=["*"],    
)
app.include_router(books_router)


app.include_router(router, prefix="/api")

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()
