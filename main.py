from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import psycopg2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://proyecto-multicloud.vercel.app", "https://www.matiasdeveloper.studio"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegistroUsuario(BaseModel):
    nombre: str
    correo: str
    mensaje: str


@app.post("/api/registrar")
def registrar_usuario(usuario: RegistroUsuario):
    try:
        DATABASE_URL = os.environ.get('DATABASE_URL')
        conexion = psycopg2.connect(DATABASE_URL)
        cursor = conexion.cursor()
        
        query = "INSERT INTO solicitudes (nombre, correo, mensaje) VALUES (%s, %s, %s);"
        cursor.execute(query, (usuario.nombre, usuario.correo, usuario.mensaje))
        
        conexion.commit()
        cursor.close()
        conexion.close()
        
        return {"status": "exito", "mensaje": "Datos guardados en la base de datos de Render"}
    except Exception as e:
        return {"status": "error", "details": str(e)}