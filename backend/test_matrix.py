import asyncio
from sqlalchemy import text
from database import engine

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, range, correlation_matrix FROM portfolio_snapshots LIMIT 5;"))
        rows = result.fetchall()
        for r in rows:
            print("ID:", r[0], "RANGE:", r[1])
            print("MATRIX TYPE:", type(r[2]), "VALUE:", r[2])

if __name__ == "__main__":
    asyncio.run(main())
