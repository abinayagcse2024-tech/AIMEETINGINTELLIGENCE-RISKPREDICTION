import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/meetintel")

engine = create_engine(DB_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE meetings ADD COLUMN speaker_mapping JSON NULL;"))
        conn.commit()
        print("Successfully added speaker_mapping column to meetings table.")
    except Exception as e:
        print(f"Error (column might already exist): {e}")
