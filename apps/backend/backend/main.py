from fastapi import FastAPI
from .hello import hello

app = FastAPI(
    title="PrivexBot Backend",
    description="Backend API for PrivexBot",
    version="0.0.1"
)

@app.get("/")
async def root():
    return {"message": hello()}