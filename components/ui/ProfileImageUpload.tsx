'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { profileAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface ProfileImageUploadProps {
  currentImageUrl?: string | null
  userFullName?: string
  onImageUpdate?: (newImageUrl: string | null) => void
  className?: string
}

export default function ProfileImageUpload({
  currentImageUrl,
  userFullName,
  onImageUpdate,
  className = ''
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Obtener URL completa de la imagen con cache busting
  const getImageUrlWithCacheBusting = (url: string | null) => {
    if (!url) return null
    const fullUrl = profileAPI.getImageUrl(url)
    if (!fullUrl) return null
    // Agregar timestamp para evitar cache de navegador
    const separator = fullUrl.includes('?') ? '&' : '?'
    return `${fullUrl}${separator}t=${Date.now()}`
  }

  const imageUrl = currentImageUrl ? getImageUrlWithCacheBusting(currentImageUrl) : null
  const displayImage = previewImage || imageUrl

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const validateImageFile = (file: File): string[] => {
    const errors: string[] = []
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      errors.push('Solo se permiten archivos JPG y PNG')
    }
    
    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      errors.push('El archivo debe ser menor a 5MB')
    }
    
    return errors
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validaciones del cliente
    const validationErrors = validateImageFile(file)
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0])
      return
    }

    // Crear preview inmediato
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setIsUploading(true)

    try {
      const result = await profileAPI.uploadProfileImage(file)
      
      if (result.success && result.data) {
        toast.success(result.message || 'Imagen actualizada correctamente')
        onImageUpdate?.(result.data.image_url)
        setPreviewImage(null) // Limpiar preview ya que ahora tenemos la imagen real
      } else {
        toast.error(result.error || 'Error al subir la imagen')
        setPreviewImage(null) // Limpiar preview en caso de error
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Error al subir la imagen')
      setPreviewImage(null) // Limpiar preview en caso de error
    } finally {
      setIsUploading(false)
      // Limpiar el input para permitir seleccionar el mismo archivo de nuevo si es necesario
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar tu imagen de perfil?')) {
      return
    }

    setIsUploading(true)

    try {
      const result = await profileAPI.deleteProfileImage()
      
      if (result.success) {
        toast.success(result.message || 'Imagen eliminada correctamente')
        onImageUpdate?.(null)
        setPreviewImage(null)
      } else {
        toast.error(result.error || 'Error al eliminar la imagen')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Error al eliminar la imagen')
    } finally {
      setIsUploading(false)
    }
  }

  const getUserInitials = () => {
    if (userFullName) {
      const names = userFullName.split(' ')
      return names.map(name => name.charAt(0)).join('').toUpperCase().substring(0, 2)
    }
    return 'U'
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Imagen o placeholder */}
      <div className="relative">
        {displayImage ? (
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
            <Image
              src={displayImage}
              alt={`Foto de perfil de ${userFullName || 'Usuario'}`}
              fill
              sizes="128px"
              className="object-cover"
              onClick={handleImageClick}
              priority={true}
              unoptimized={process.env.NODE_ENV === 'development'}
            />
          </div>
        ) : (
          <div 
            className="w-32 h-32 bg-gradient-to-r from-primary to-red-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={handleImageClick}
          >
            <span className="text-white font-bold text-2xl">
              {getUserInitials()}
            </span>
          </div>
        )}
        
        {/* Overlay de carga */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="text-white text-center">
              <svg className="animate-spin mx-auto h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs">Subiendo...</span>
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col space-y-2 w-full max-w-xs">
        <Button
          type="button"
          variant="primary"
          onClick={handleImageClick}
          disabled={isUploading}
          className="w-full"
        >
          {displayImage ? 'Cambiar Foto' : 'Subir Foto'}
        </Button>
        
        {(displayImage || currentImageUrl) && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDeleteImage}
            disabled={isUploading}
            className="w-full text-red-600 border-red-600 hover:bg-red-50"
          >
            Eliminar Foto
          </Button>
        )}
      </div>

      {/* Información */}
      <p className="text-xs text-gray-500 text-center max-w-xs">
        JPG, PNG. Máximo 5MB.<br />
        Haz clic en la imagen para cambiarla.
      </p>

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}