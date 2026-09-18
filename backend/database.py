from typing import Optional, List, Dict, Any
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from backend.config import MONGODB_URI, DB_NAME

logger = logging.getLogger("vitspot.db")

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None
    
    # In-memory storage cache for instant lookup and fallback
    rooms_cache: Dict[str, dict] = {}
    schedules_cache: List[dict] = []
    overrides_cache: Dict[str, dict] = {}
    status_cache: Dict[str, dict] = {}

db_instance = Database()

async def connect_db():
    try:
        db_instance.client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Test connection
        await db_instance.client.admin.command('ping')
        db_instance.db = db_instance.client[DB_NAME]
        
        # Ensure indexes
        await db_instance.db.rooms.create_index("room_id", unique=True)
        await db_instance.db.room_schedule.create_index([("room_id", 1), ("day", 1)])
        await db_instance.db.live_overrides.create_index("room_id", unique=True)
        await db_instance.db.room_status.create_index("room_id", unique=True)
        
        logger.info("Connected successfully to MongoDB at %s", MONGODB_URI)
    except Exception as e:
        logger.warning("MongoDB connection failed or timed out: %s. Using high-speed in-memory store.", e)
        db_instance.client = None
        db_instance.db = None

async def close_db():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")
