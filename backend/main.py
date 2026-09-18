"""
VitSpot Backend Application.
FastAPI + MongoDB + WebSockets + Deterministic Space Intelligence Engine.
Pearl Research Park (PRP), VIT Vellore.
"""

from contextlib import asynccontextmanager
import asyncio
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CORS_ORIGINS
from backend.database import connect_db, close_db, db_instance
from backend.seed_data import populate_database
from backend.state_manager import state_manager

from backend.routes.rooms import router as rooms_router
from backend.routes.campus import router as campus_router
from backend.routes.overrides import router as overrides_router
from backend.routes.admin import router as admin_router
from backend.routes.simulation import router as simulation_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("vitspot.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing VitSpot Space Intelligence Platform...")
    await connect_db()
    
    # Populate physical PRP dataset & schedule cache
    await populate_database()
        
    # Compute initial state for all rooms
    state_manager.recompute_all()
    logger.info("Computed initial states for %d rooms in PRP.", len(state_manager.status_cache))
    
    # Start the event scheduler loop for next_change triggers
    state_manager.worker_task = asyncio.create_task(state_manager.event_scheduler_loop())
    
    yield
    
    # Shutdown
    if state_manager.worker_task:
        state_manager.worker_task.cancel()
    await close_db()
    logger.info("VitSpot shutdown complete.")

app = FastAPI(
    title="VitSpot — Live Campus Space Intelligence API",
    description="Real-time deterministic room availability engine for Pearl Research Park (PRP), VIT Vellore.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(rooms_router)
app.include_router(campus_router)
app.include_router(overrides_router)
app.include_router(admin_router)
app.include_router(simulation_router)

@app.get("/")
def root():
    return {
        "platform": "VitSpot",
        "description": "Live Campus Space Intelligence Platform (Pearl Research Park, VIT)",
        "building": "PRP (G+7 Floors)",
        "status": "operational",
        "endpoints": {
            "rooms": "/rooms",
            "campus_summary": "/campus/summary",
            "faculty_release": "/faculty/release",
            "qr_report": "/qr/report",
            "simulation": "/sim/time",
            "websocket": "/ws/updates",
            "docs": "/docs"
        }
    }

@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket channel: room_state_update pushes state updates instantly on transition."""
    await state_manager.connect_ws(websocket)
    try:
        while True:
            # Keep connection alive, listen for optional ping/client commands
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        state_manager.disconnect_ws(websocket)
    except Exception:
        state_manager.disconnect_ws(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
