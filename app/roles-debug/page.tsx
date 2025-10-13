'use client'

import { useRoles } from '@/context/RoleContext'
import { useAuth } from '@/context/AuthContext'

export default function RoleDebugPage() {
  const { userRoles, loading, hasRole, hasAnyRole, isAdmin, isSuperuser } = useRoles()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">🔐 Debug Roles</h1>
            <p className="text-gray-600">Debes estar autenticado para ver los roles.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🔐 Debug Roles y Permisos</h1>
          
          <div className="space-y-6">
            {/* Información del usuario */}
            <div>
              <h2 className="text-xl font-semibold mb-4">👤 Usuario Actual</h2>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>

            {/* Estado de carga */}
            {loading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-blue-600">Cargando roles...</span>
                </div>
              </div>
            )}

            {/* Información de roles */}
            <div>
              <h2 className="text-xl font-semibold mb-4">🎭 Roles del Usuario</h2>
              {userRoles ? (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm overflow-auto">
                    {JSON.stringify(userRoles, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-yellow-700">No se pudieron cargar los roles del usuario.</p>
                </div>
              )}
            </div>

            {/* Funciones de verificación */}
            <div>
              <h2 className="text-xl font-semibold mb-4">🔍 Verificaciones de Roles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Roles Individuales</h3>
                  <div className="space-y-2 text-sm">
                    <div>hasRole(&apos;admin&apos;): <span className={hasRole('admin') ? 'text-green-600' : 'text-red-600'}>{hasRole('admin').toString()}</span></div>
                    <div>hasRole(&apos;user&apos;): <span className={hasRole('user') ? 'text-green-600' : 'text-red-600'}>{hasRole('user').toString()}</span></div>
                    <div>hasRole(&apos;moderator&apos;): <span className={hasRole('moderator') ? 'text-green-600' : 'text-red-600'}>{hasRole('moderator').toString()}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Verificaciones Especiales</h3>
                  <div className="space-y-2 text-sm">
                    <div>isAdmin(): <span className={isAdmin() ? 'text-green-600' : 'text-red-600'}>{isAdmin().toString()}</span></div>
                    <div>isSuperuser(): <span className={isSuperuser() ? 'text-green-600' : 'text-red-600'}>{isSuperuser().toString()}</span></div>
                    <div>hasAnyRole([&apos;admin&apos;, &apos;moderator&apos;]): <span className={hasAnyRole(['admin', 'moderator']) ? 'text-green-600' : 'text-red-600'}>{hasAnyRole(['admin', 'moderator']).toString()}</span></div>
                    <div>hasAnyRole([&apos;user&apos;, &apos;guest&apos;]): <span className={hasAnyRole(['user', 'guest']) ? 'text-green-600' : 'text-red-600'}>{hasAnyRole(['user', 'guest']).toString()}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ejemplo de uso en componentes */}
            <div>
              <h2 className="text-xl font-semibold mb-4">💡 Ejemplo de Uso</h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="font-semibold mb-2">En componentes React:</h3>
                <pre className="text-sm overflow-auto bg-white p-2 rounded">
{`import { useRoles } from '@/context/RoleContext'

const MyComponent = () => {
  const { hasRole, isAdmin } = useRoles()

  if (!isAdmin()) {
    return <div>Acceso denegado</div>
  }

  return (
    <div>
      {hasRole('admin') && <AdminPanel />}
      {hasRole('moderator') && <ModeratorTools />}
    </div>
  )
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}