'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export default function ComparativosPage() {
  const options = [
    {
      title: 'Proyectos de Comunidades',
      description: 'Gestión y comparativa de seguros para comunidades de propietarios.',
      href: '/proyectos/comunidades',
      icon: (
        <svg className="w-12 h-12 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'Todo Riesgo Construcción',
      description: 'Análisis y cotización de seguros para obras y construcción.',
      href: '/comparativos/todo-riesgo-construccion',
      icon: (
        <svg className="w-12 h-12 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-orange-50 hover:bg-orange-100'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Comparativos</h1>
        <p className="mt-2 text-gray-600">Selecciona el tipo de seguro que deseas gestionar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option) => (
          <Link href={option.href} key={option.href} className="block group transition-transform hover:-translate-y-1">
            <Card className={`h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 ${option.color}`}>
              <div className="flex flex-col items-center text-center p-6">
                <div className="p-4 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow mb-4">
                  {option.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  {option.title}
                </h2>
                <p className="text-gray-600">
                  {option.description}
                </p>
                <div className="mt-6 flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                  <span>Acceder</span>
                  <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
