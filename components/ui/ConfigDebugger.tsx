'use client'

import config, { validateConfig } from '@/lib/config'

export function ConfigDebugger() {
  const validation = validateConfig()
  
  // Solo mostrar en desarrollo
  if (config.isProd) return null
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-sm font-mono max-w-sm">
      <div className="mb-2 font-bold text-green-400">🔧 Config Debug</div>
      
      <div className="space-y-1">
        <div>
          <span className="text-blue-300">API URL:</span>
          <span className="ml-2">{config.apiUrl}</span>
        </div>
        
        <div>
          <span className="text-blue-300">Environment:</span>
          <span className="ml-2">{process.env.NODE_ENV}</span>
        </div>
        
        <div>
          <span className="text-blue-300">Valid Config:</span>
          <span className={`ml-2 ${validation.isValid ? 'text-green-400' : 'text-red-400'}`}>
            {validation.isValid ? '✅' : '❌'}
          </span>
        </div>
        
        {validation.missing.length > 0 && (
          <div>
            <span className="text-red-300">Missing:</span>
            <div className="ml-2 text-red-400">
              {validation.missing.join(', ')}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        Solo visible en desarrollo
      </div>
    </div>
  )
}