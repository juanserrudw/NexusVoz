import requests
import json

class AuthClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
        self.headers = {}
    
    def register(self, email, username, full_name, password):
        """Registrar un nuevo usuario"""
        data = {
            "email": email,
            "username": username,
            "full_name": full_name,
            "password": password
        }
        response = requests.post(f"{self.base_url}/register", json=data)
        return response.json()
    
    def login(self, email, password):
        """Iniciar sesión"""
        data = {
            "email": email,
            "password": password
        }
        response = requests.post(f"{self.base_url}/login", json=data)
        if response.status_code == 200:
            result = response.json()
            self.token = result["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            return result
        return response.json()
    
    def get_profile(self):
        """Obtener perfil del usuario actual"""
        response = requests.get(f"{self.base_url}/users/me", headers=self.headers)
        return response.json()
    
    def create_retelli_response(self, query, response_text, session_id=None, response_time=None, confidence_score=None):
        """Crear una respuesta de RetelliA"""
        data = {
            "query": query,
            "response": response_text,
            "session_id": session_id,
            "response_time": response_time,
            "confidence_score": confidence_score
        }
        response = requests.post(f"{self.base_url}/retelli/responses", json=data, headers=self.headers)
        return response.json()
    
    def get_my_responses(self, skip=0, limit=100):
        """Obtener mis respuestas de RetelliA"""
        response = requests.get(f"{self.base_url}/retelli/responses/me?skip={skip}&limit={limit}", headers=self.headers)
        return response.json()

# Ejemplo de uso
if __name__ == "__main__":
    client = AuthClient()
    
    # Registrar usuario
    print("Registrando usuario...")
    register_result = client.register("demo@example.com", "demouser", "Demo User", "demopassword123")
    print(f"Registro: {register_result}")
    
    # Iniciar sesión
    print("\nIniciando sesión...")
    login_result = client.login("demo@example.com", "demopassword123")
    print(f"Login: {login_result}")
    
    # Obtener perfil
    print("\nObteniendo perfil...")
    profile = client.get_profile()
    print(f"Perfil: {profile}")
    
    # Crear respuesta de RetelliA
    print("\nCreando respuesta de RetelliA...")
    retelli_response = client.create_retelli_response(
        query="¿Cómo está el clima hoy?",
        response_text="Hoy está soleado con una temperatura de 25°C",
        session_id="session_123",
        response_time=1500,
        confidence_score="high"
    )
    print(f"Respuesta RetelliA: {retelli_response}")
    
    # Obtener respuestas
    print("\nObteniendo mis respuestas...")
    my_responses = client.get_my_responses()
    print(f"Mis respuestas: {my_responses}")