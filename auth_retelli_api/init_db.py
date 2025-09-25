from sqlalchemy import create_engine
from database import Base
import os
from dotenv import load_dotenv

load_dotenv()

def init_database():
    DATABASE_URL = os.getenv("DATABASE_URL")
    engine = create_engine(DATABASE_URL)
   
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    print("Base de datos inicializada correctamente!")

if __name__ == "__main__":
    init_database()