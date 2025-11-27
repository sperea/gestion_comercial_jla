'use client'

import { useGroups } from '@/context/GroupContext'
import { useAuth } from '@/context/AuthContext'

export default function RoleDebugPage() {
  const { userGroups, loading, hasGroup, hasAnyGroup, getGroupNames, isCollaboradorExterno, hasSiniestrosAccess } = useGroups()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">🔐 Debug Grupos</h1>
            <p className="text-gray-600">Debes estar autenticado para ver los grupos.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🔐 Debug Grupos y Permisos</h1>
          
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
                  <span className="text-blue-600">Cargando grupos...</span>
                </div>
              </div>
            )}

            {/* Información de grupos */}
            <div>
              <h2 className="text-xl font-semibold mb-4">👥 Grupos del Usuario</h2>
              {userGroups && userGroups.length > 0 ? (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="space-y-2">
                    {userGroups.map((group) => (
                      <div key={group.id} className="bg-white p-3 rounded border">
                        <div className="text-sm space-y-1">
                          <div><strong>Nombre:</strong> {group.name}</div>
                          {group.permissions && group.permissions.length > 0 && (
                            <div>
                              <strong>Permisos:</strong>
                              <ul className="list-disc list-inside ml-4 text-xs text-gray-600">
                                {group.permissions.map((perm) => (
                                  <li key={perm.id}>{perm.name} ({perm.codename})</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-yellow-700">El usuario no pertenece a ningún grupo.</p>
                </div>
              )}
            </div>

            {/* Funciones de verificación */}
            <div>
              <h2 className="text-xl font-semibold mb-4">🔍 Verificaciones de Grupos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Grupos del Sistema JLA</h3>
                  <div className="space-y-2 text-sm">
                    <div>hasGroup('Colaborador Externo'): <span className={hasGroup('Colaborador Externo') ? 'text-green-600' : 'text-red-600'}>{hasGroup('Colaborador Externo').toString()}</span></div>
                    <div>hasGroup('Siniestros'): <span className={hasGroup('Siniestros') ? 'text-green-600' : 'text-red-600'}>{hasGroup('Siniestros').toString()}</span></div>
                    <div>hasGroup('Administradores'): <span className={hasGroup('Administradores') ? 'text-green-600' : 'text-red-600'}>{hasGroup('Administradores').toString()}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Verificaciones Especiales</h3>
                  <div className="space-y-2 text-sm">
                    <div>isCollaboradorExterno: <span className={isCollaboradorExterno ? 'text-green-600' : 'text-red-600'}>{isCollaboradorExterno.toString()}</span></div>
                    <div>hasSiniestrosAccess: <span className={hasSiniestrosAccess ? 'text-green-600' : 'text-red-600'}>{hasSiniestrosAccess.toString()}</span></div>
                    <div>hasAnyGroup(['Siniestros', 'Administradores']): <span className={hasAnyGroup(['Siniestros', 'Administradores']) ? 'text-green-600' : 'text-red-600'}>{hasAnyGroup(['Siniestros', 'Administradores']).toString()}</span></div>
                    <div>Grupos actuales: {getGroupNames().join(', ') || 'Ninguno'}</div>
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
{`import { useGroups } from '@/context/GroupContext'

const MyComponent = () => {
  const { hasGroup, isCollaboradorExterno } = useGroups()

  if (isCollaboradorExterno) {
    return <div>Vista para colaborador externo</div>
  }

  return (
    <div>
      {hasGroup('Administradores') && <AdminPanel />}
      {hasGroup('Siniestros') && <SiniestrosTools />}
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