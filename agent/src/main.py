from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import agent_router, chat_router

app = FastAPI(title="Medcurial Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router)
app.include_router(chat_router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}
