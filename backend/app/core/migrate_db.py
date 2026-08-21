from sqlalchemy import text
from app.core.database import engine, Base

def migrate_schema():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE meetings ADD COLUMN meeting_url VARCHAR(500)"))
            conn.commit()
            print("[INFO] Added meeting_url column to meetings table.")
        except Exception as e:
            # Column already exists
            pass

if __name__ == "__main__":
    migrate_schema()
