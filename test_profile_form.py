#!/usr/bin/env python3
import requests
import json
import time

# URL base del frontend
FRONTEND_URL = "http://localhost:3000"

def test_profile_form_flow():
    """Simula exactamente el flujo del formulario de perfil en el navegador"""
    session = requests.Session()
    
    print("🎯 Simulando flujo completo del formulario de perfil...")
    
    # 1. Login
    print("\n🔐 Paso 1: Login...")
    login_data = {
        "email": "sperea@jlaasociados.es",
        "password": "jla"
    }
    
    login_response = session.post(
        f"{FRONTEND_URL}/api/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Error en login: {login_response.text}")
        return False
        
    print("✅ Login exitoso")
    
    # Extraer token de las cookies
    access_token = None
    for cookie in session.cookies:
        if cookie.name == 'access-token':
            access_token = cookie.value
            break
    
    if not access_token:
        print("❌ No se encontró token de acceso")
        return False
        
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    # 2. Cargar página de perfil (GET inicial)
    print("\n📄 Paso 2: Cargando perfil inicial...")
    profile_response = session.get(
        f"{FRONTEND_URL}/api/users/me/profile/",
        headers=headers
    )
    
    if profile_response.status_code != 200:
        print(f"❌ Error cargando perfil: {profile_response.text}")
        return False
    
    profile_data = profile_response.json()
    original_phone = profile_data.get('phone', '')
    print(f"✅ Perfil cargado - Teléfono actual: '{original_phone}'")
    
    # 3. Simular cambio en el formulario
    print("\n✏️ Paso 3: Simulando cambio en formulario...")
    new_phone = "+34666777888"
    print(f"🔄 Cambiando teléfono de '{original_phone}' a '{new_phone}'")
    
    # 4. Enviar actualización (PUT)
    print("\n💾 Paso 4: Enviando actualización...")
    update_data = {
        "phone": new_phone
    }
    
    update_response = session.put(
        f"{FRONTEND_URL}/api/users/me/profile/",
        json=update_data,
        headers=headers
    )
    
    print(f"PUT Status: {update_response.status_code}")
    
    if update_response.status_code != 200:
        print(f"❌ Error en actualización: {update_response.text}")
        return False
    
    update_result = update_response.json()
    print(f"✅ Actualización exitosa: {update_result.get('message', 'Sin mensaje')}")
    
    # 5. Verificar inmediatamente (simulando lo que haría el formulario)
    print("\n🔍 Paso 5: Verificación inmediata (como haría el formulario)...")
    
    # Esperar un poco para simular el tiempo de procesamiento
    time.sleep(0.5)
    
    verify_response = session.get(
        f"{FRONTEND_URL}/api/users/me/profile/",
        headers=headers
    )
    
    if verify_response.status_code != 200:
        print(f"❌ Error en verificación: {verify_response.text}")
        return False
    
    verify_data = verify_response.json()
    final_phone = verify_data.get('phone', '')
    
    print(f"📞 Teléfono después de actualización: '{final_phone}'")
    
    # 6. Resultado final
    print("\n🎯 RESULTADO:")
    if final_phone == new_phone:
        print(f"✅ ÉXITO: El teléfono se actualizó correctamente")
        print(f"   Antes: '{original_phone}'")
        print(f"   Después: '{final_phone}'")
        return True
    else:
        print(f"❌ FALLO: El teléfono NO se actualizó")
        print(f"   Esperado: '{new_phone}'")
        print(f"   Actual: '{final_phone}'")
        print(f"   Original: '{original_phone}'")
        return False

def test_multiple_updates():
    """Prueba múltiples actualizaciones seguidas"""
    print("\n" + "="*50)
    print("🔄 PRUEBA DE MÚLTIPLES ACTUALIZACIONES")
    print("="*50)
    
    test_phones = ["+34111111111", "+34222222222", "+34333333333"]
    
    for i, phone in enumerate(test_phones, 1):
        print(f"\n--- Prueba {i}/3: {phone} ---")
        success = test_profile_form_flow()
        if not success:
            print(f"❌ Falló en la prueba {i}")
            break
        print(f"✅ Prueba {i} exitosa")
        time.sleep(1)  # Pausa entre pruebas

if __name__ == "__main__":
    print("🧪 PRUEBA DEL FORMULARIO DE PERFIL")
    print("="*50)
    
    # Prueba individual
    success = test_profile_form_flow()
    
    if success:
        # Si la primera prueba es exitosa, hacer múltiples pruebas
        test_multiple_updates()
    else:
        print("\n❌ La prueba básica falló, no se realizarán más pruebas")