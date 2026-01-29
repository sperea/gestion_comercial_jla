# Módulo Garantía Decenal - Documentación

## 📋 Descripción General

El módulo de **Garantía Decenal** es un sistema completo de gestión de proyectos de garantía decenal con ofertas de compañías aseguradoras. Está diseñado siguiendo la misma estructura que el módulo de "Todo Riesgo Construcción".

## 🏗️ Estructura del Proyecto

### Backend API

- **Base URL**: `/ramo-garantia-decenal/`
- **Autenticación**: Todos los endpoints requieren token JWT

### Frontend (Next.js)

```
app/comparativos/garantia-decenal/
├── page.tsx                          # Listado de proyectos
├── nuevo/
│   └── page.tsx                      # Crear nuevo proyecto
├── [id]/
│   ├── page.tsx                      # Detalle del proyecto + ofertas
│   └── oferta/
│       ├── nueva/
│       │   └── page.tsx              # Crear nueva oferta
│       └── [ofertaId]/
│           └── page.tsx              # Editar oferta existente
└── components/
    └── OfertaForm.tsx                # Formulario de oferta (crear/editar)
```

## 📦 Archivos Creados

### 1. Tipos TypeScript

**Archivo**: `lib/types/garantia-decenal.ts`

- `DecenalProyecto`: Datos del proyecto
- `OfertaDecenal`: Datos de la oferta
- `Cobertura`: Coberturas disponibles
- `CompaniaInfo`: Información de compañías
- `PaginatedResponse<T>`: Respuesta paginada genérica
- `ProyectoFilters`: Filtros para búsqueda

### 2. Cliente API

**Archivo**: `lib/api-garantia-decenal.ts`

- Clase `GarantiaDecenalAPI` con métodos para:
  - CRUD de proyectos
  - CRUD de ofertas
  - CRUD de coberturas
  - Obtener compañías

### 3. Configuración API

**Archivo**: `lib/api-config.ts` (actualizado)

- Añadidos endpoints para Garantía Decenal:
  ```typescript
  garantiaDecenal: {
    proyectos: '/ramo-garantia-decenal/proyectos/',
    ofertas: '/ramo-garantia-decenal/ofertas/',
    coberturas: '/ramo-garantia-decenal/coberturas/',
  }
  ```

### 4. Páginas Frontend

#### Página Principal de Comparativos

**Archivo**: `app/comparativos/page.tsx` (actualizado)

- Añadida tarjeta de "Garantía Decenal" con icono de escudo verde

#### Listado de Proyectos

**Archivo**: `app/comparativos/garantia-decenal/page.tsx`

- Lista todos los proyectos de garantía decenal
- Búsqueda por obra, tomador o situación
- Paginación
- Botón para crear nuevo proyecto

#### Crear Proyecto

**Archivo**: `app/comparativos/garantia-decenal/nuevo/page.tsx`

- Formulario para crear nuevo proyecto
- Campos:
  - Tomador
  - Obra
  - Situación
  - Fecha de Vigencia
  - Duración de la Obra
- Comercial asignado automáticamente (usuario autenticado)

#### Detalle del Proyecto

**Archivo**: `app/comparativos/garantia-decenal/[id]/page.tsx`

- Muestra datos generales del proyecto
- Lista todas las ofertas asociadas
- Botones para:
  - Descargar PDF (pendiente implementación)
  - Eliminar proyecto
  - Crear nueva oferta
- Cada oferta muestra:
  - Logo y nombre de la compañía
  - Capital asegurado
  - Franquicia
  - Tasas
  - Prima neta y total
  - Coberturas incluidas
  - Enlace al archivo PDF (si existe)

#### Crear/Editar Oferta

**Archivos**:

- `app/comparativos/garantia-decenal/[id]/oferta/nueva/page.tsx`
- `app/comparativos/garantia-decenal/[id]/oferta/[ofertaId]/page.tsx`
- `app/comparativos/garantia-decenal/components/OfertaForm.tsx`

Formulario con:

- Selección de compañía aseguradora
- Capital asegurado (con formato de moneda)
- Franquicia (texto simple, ej: "1% MAX 2.500")
- Tasas (%)
- Prima neta (con formato de moneda)
- Prima total (con formato de moneda)
- Forma de pago (textarea con valor por defecto)
- Aviso/Notas (textarea con valor por defecto)
- Archivo adjunto (PDF, imágenes)
- Selección múltiple de coberturas (checkboxes visuales)

## 🎨 Características de UI

### Diseño Consistente

- Sigue el mismo patrón de diseño que "Todo Riesgo Construcción"
- Colores temáticos: Verde para Garantía Decenal
- Iconos: Escudo con check para representar garantía

### Componentes Reutilizables

- `Button`: Botones con variantes (primary, outline)
- `Input`: Campos de entrada con labels
- `Card`: Tarjetas para mostrar información
- `LoadingSpinner`: Indicador de carga
- `CurrencyInput`: Input especializado para monedas

### Experiencia de Usuario

- Búsqueda con debounce (500ms)
- Paginación automática
- Mensajes de éxito/error con toasts
- Confirmación antes de eliminar
- Navegación breadcrumb
- Formularios con validación

## 📊 Datos del Proyecto

### Ejemplo de Proyecto

```typescript
{
  comercial: "japerea",
  fecha_creacion: "9 de julio de 2020",
  fecha_vigencia: "9 de julio de 2020",
  tomador: "VILLA TRINIDAD S.L.",
  obra: "Bloque Residencial con 19 viviendas, 3 Despachos, 1 Local con Garajes y Trasteros, C/ Amapolas, 14. Collado Villalba. Madrid",
  situacion: "COLLADO VILLALBA",
  duracion: "18 MESES"
}
```

### Ejemplo de Ofertas

```typescript
[
  {
    compania: "Musaat",
    capital: "1.633.813,98",
    franquicia: "1% MAX 2.500",
    tasas: "0.23",
    prima_neta: "3.757,77",
    prima_total: "3.988,87",
  },
  {
    compania: "Allianz",
    capital: "1.633.813,98",
    franquicia: "3.000",
    tasas: "0.25",
    prima_neta: "4.329,60",
    prima_total: "4.595,87",
  },
];
```

## 🔄 Flujo de Trabajo

1. **Crear Proyecto**
   - Usuario navega a Comparativos > Garantía Decenal
   - Click en "+ Nuevo Proyecto"
   - Completa formulario con datos del proyecto
   - Sistema asigna automáticamente el comercial (usuario autenticado)
   - Proyecto creado y redirige a página de detalle

2. **Añadir Ofertas**
   - Desde la página de detalle del proyecto
   - Click en "+ Nueva Oferta"
   - Selecciona compañía aseguradora
   - Completa datos económicos (capital, franquicia, tasas, primas)
   - Selecciona coberturas incluidas
   - Opcionalmente adjunta archivo PDF
   - Guarda oferta

3. **Comparar Ofertas**
   - En la página de detalle del proyecto se muestran todas las ofertas
   - Vista en tarjetas con información clave
   - Fácil comparación visual de primas y coberturas

4. **Descargar PDF** (Pendiente)
   - Botón para generar PDF comparativo
   - Incluirá datos del proyecto y todas las ofertas

## 🔐 Seguridad

- Todos los endpoints requieren autenticación JWT
- El comercial se asigna automáticamente al usuario autenticado
- Validación de datos en frontend y backend
- Manejo de errores con mensajes descriptivos

## 🚀 Próximas Mejoras

1. **Generación de PDF**
   - Implementar generación de PDF comparativo
   - Incluir logo de compañías
   - Formato profesional con datos del proyecto y ofertas

2. **Filtros Avanzados**
   - Filtrar por compañía
   - Filtrar por rango de fechas
   - Filtrar por comercial

3. **Estadísticas**
   - Dashboard con métricas
   - Comparativas históricas
   - Análisis de tendencias

4. **Notificaciones**
   - Alertas de vencimiento
   - Recordatorios de seguimiento

## 📝 Notas Técnicas

### Diferencias con Todo Riesgo Construcción

- **Franquicias**: En Garantía Decenal es un campo de texto simple, no una lista de franquicias
- **Valores por defecto**: Los campos `forma_pago` y `aviso` tienen textos predefinidos específicos para Garantía Decenal
- **Estructura de datos**: Similar pero adaptada a las necesidades específicas del ramo

### Manejo de Archivos

- Soporte para subir archivos PDF
- FormData para envío de archivos
- JSON para actualizaciones sin archivo
- Visualización de archivo actual en modo edición

### Coberturas

- Sistema de selección múltiple
- Interfaz visual con checkboxes estilizados
- Botón de recarga para actualizar lista
- Contador de coberturas seleccionadas

## 🐛 Solución de Problemas

### Error al cargar proyectos

- Verificar que el backend esté corriendo
- Verificar token de autenticación
- Revisar console del navegador para detalles

### Error al crear oferta

- Verificar que todos los campos requeridos estén completos
- Verificar formato de números (usar punto decimal)
- Revisar que la compañía esté seleccionada

### Archivo no se sube

- Verificar tamaño del archivo (límite del servidor)
- Verificar formato del archivo
- Revisar permisos del servidor

## 📞 Soporte

Para cualquier duda o problema, contactar al equipo de desarrollo.
