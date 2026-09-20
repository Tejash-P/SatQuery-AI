from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, projects, images, pairs, analysis, exports

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(pairs.router, prefix="/pairs", tags=["pairs"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(exports.router, prefix="/exports", tags=["exports"])

