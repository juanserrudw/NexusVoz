# Crea un archivo llamado debug_env.py
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print("DATABASE_URL completa:", repr(DATABASE_URL))
print("Longitud:", len(DATABASE_URL) if DATABASE_URL else "None")
print("Bytes:", DATABASE_URL.encode('utf-8', errors='replace') if DATABASE_URL else "None")

# También vamos a verificar cada carácter
if DATABASE_URL:
    for i, char in enumerate(DATABASE_URL):
        print(f"Posición {i}: '{char}' (ord: {ord(char)})")