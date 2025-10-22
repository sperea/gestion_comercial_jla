#!/usr/bin/env python3
import requests
import json

# URL base del frontend
FRONTEND_URL = "http://localhost:3000"

def test_authentication():
    session = requests.Session()
    
    # 1. Hacer login con las credenciales correctas
    print("🔐 Haciendo login...")
    login_data = {
        "email": "sperea@jlaasociados.es",
        "password": "jla"
    }
    
    login_response = session.post(
        f"{FRONTEND_URL}/api/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Login status: {login_response.status_code}")
    if login_response.status_code == 200:
        print("✅ Login exitoso")
        print(f"Cookies recibidas: {session.cookies}")
        login_result = login_response.json()
        print(f"Usuario: {login_result.get('user', {}).get('username', 'No disponible')}")
    else:
        print(f"❌ Error en login: {login_response.text}")
        return
    
    # 2. Obtener perfil
    print("\n📄 Obteniendo perfil...")
    
    # Extraer el token de las cookies para usarlo como Authorization header
    access_token = None
    for cookie in session.cookies:
        if cookie.name == 'access-token':
            access_token = cookie.value
            break
    
    headers = {"Content-Type": "application/json"}
    if access_token:
        headers['Authorization'] = f'Bearer {access_token}'
        print(f"🔑 Usando token: {access_token[:20]}...")
    
    profile_response = session.get(
        f"{FRONTEND_URL}/api/users/me/profile/",
        headers=headers
    )
    print(f"Get profile status: {profile_response.status_code}")
    
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        print("✅ Perfil obtenido exitosamente")
        print(f"Datos del perfil: {json.dumps(profile_data, indent=2)}")
        current_phone = profile_data.get('phone', 'Sin teléfono')
        print(f"📞 Teléfono actual: {current_phone}")
    else:
        print(f"❌ Error obteniendo perfil: {profile_response.text}")
        return
    
    # 3. Actualizar perfil
    print("\n✏️ Actualizando perfil...")
    new_phone = "+34111222333"  # Nuevo teléfono para probar
    update_data = {
        "phone": new_phone
    }
    
    update_response = session.put(
        f"{FRONTEND_URL}/api/users/me/profile/",
        json=update_data,
        headers=headers
    )
    
    print(f"Update profile status: {update_response.status_code}")
    if update_response.status_code == 200:
        updated_data = update_response.json()
        print("✅ Perfil actualizado exitosamente")
        print(f"Respuesta: {json.dumps(updated_data, indent=2)}")
        
        # Verificar que el cambio se guardó
        print("\n🔍 Verificando que el cambio se guardó...")
        verify_response = session.get(
            f"{FRONTEND_URL}/api/users/me/profile/",
            headers=headers
        )
        
        if verify_response.status_code == 200:
            verify_data = verify_response.json()
            saved_phone = verify_data.get('phone', 'Sin teléfono')
            print(f"📞 Teléfono después de actualizar: {saved_phone}")
            
            if saved_phone == new_phone:
                print("✅ El teléfono se guardó correctamente")
            else:
                print(f"❌ El teléfono NO se guardó. Esperado: {new_phone}, Actual: {saved_phone}")
        
    else:
        print(f"❌ Error actualizando perfil: {update_response.text}")
        # Intentar obtener más información del error
        try:
            error_data = update_response.json()
            print(f"🔍 Detalles del error: {json.dumps(error_data, indent=2)}")
        except:
            print("No se pudo parsear la respuesta como JSON")

if __name__ == "__main__":
    test_authentication()