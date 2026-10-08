import asyncio
import sys
import os

# Add the backend directory to sys.path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import async_session_factory, engine
from app.models import Ban

async def main():
    async with async_session_factory() as db:
        from sqlalchemy import select, func
        count = await db.scalar(select(func.count()).select_from(Ban))
        if count == 0:
            print("Seeding Bàn...")
            for i in range(1, 7):
                db.add(Ban(tenban=f"Bàn 0{i}", trangthai=1))
            await db.commit()
            print("Done seeding Bàn 01 -> Bàn 06.")
        else:
            print(f"Database already has {count} tables.")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
