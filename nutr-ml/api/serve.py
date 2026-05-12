"""
ML Microservice — serves the nutrition recommender to the Django backend.

Start:
    uvicorn api.serve:app --host 0.0.0.0 --port 8001 --reload

Then set in nutr-backend .env:
    AI_ENGINE_URL=http://localhost:8001/ml/recommend
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
load_dotenv()

app = FastAPI(title="NutritionX ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

_recommender = None
ML_API_KEY = os.getenv("ML_API_KEY", "")


def _verify_key(authorization: str = ""):
    if ML_API_KEY and authorization != f"Bearer {ML_API_KEY}":
        raise HTTPException(status_code=401, detail="Invalid ML API key")


def _get_recommender():
    global _recommender
    if _recommender is None:
        from models.recommender.predict import NutritionRecommender
        _recommender = NutritionRecommender(
            os.getenv("RECOMMENDER_MODEL_PATH", "saved_models/recommender")
        )
    return _recommender


@app.get("/health")
def health():
    return {"status": "ok"}


class UserProfile(BaseModel):
    age: float
    gender: str
    weight_kg: float
    height_cm: float
    bmi: float = 0.0
    activity_level: str = "sedentary"
    primary_condition: str = "none"
    goal_type: str = "maintenance"
    avg_daily_calories: float = 0.0
    avg_daily_protein: float = 0.0
    avg_daily_carbs: float = 0.0
    avg_daily_fat: float = 0.0
    primary_medication: str = "none"
    medication_count: float = 0.0


@app.post("/ml/recommend")
def recommend(profile: UserProfile, authorization: str = Header(default="")):
    _verify_key(authorization)
    rec = _get_recommender()
    result = rec.predict(profile.model_dump())
    return result
