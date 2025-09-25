from sqlalchemy import create_engine, text

# Conexión directa sin variables de entorno
DATABASE_URL = "postgresql://postgres:123456@localhost:5432/nexusvoz_db"

try:
    engine = create_engine(DATABASE_URL, echo=True)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        print("Conexión exitosa!")
        print("Versión PostgreSQL:", result.fetchone()[0])
except Exception as e:
    print("Error:", e)
    print("Tipo de error:", type(e))