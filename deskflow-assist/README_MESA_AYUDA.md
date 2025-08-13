# Mesa de Ayuda - Área de Contabilidad

Sistema centralizado de Mesa de Ayuda diseñado para optimizar los procesos del área de contabilidad empresarial.

## 🚀 Funcionalidades Principales

### 1. Generador de Comunicados
- Creación de documentos oficiales (memorándums, circulares, notificaciones)
- Formularios estructurados con validación
- Generación automática en formato estándar empresarial
- Configuración de prioridades y fechas límite

### 2. Generador de Cotizaciones
- Cotizaciones profesionales con cálculos automáticos
- Soporte para múltiples monedas (USD, EUR, COP)
- Gestión de items con cantidades y precios
- Términos y condiciones personalizables
- Cálculo automático de totales

### 3. Sistema de Notificaciones Automatizadas
- **Integración existente con Amazon QA** (desarrollado en Visual Studio)
- Ejecución de consultas programadas
- Historial de notificaciones enviadas
- Configuración de frecuencias y parámetros
- Panel de administración para el sistema

## 🏗️ Arquitectura Extensible

### Diseño Modular
```
src/
├── components/
│   ├── Dashboard/          # Componentes del tablero principal
│   ├── Forms/              # Formularios modulares por funcionalidad  
│   ├── Layout/             # Componentes de diseño (Header, etc.)
│   └── Documentation/      # Guías de extensibilidad
├── pages/                  # Vistas principales
└── services/              # Lógica de integración con APIs
```

### Puntos de Extensión
- **ServiceCard**: Agregar nuevos servicios al dashboard
- **ActiveView**: Enum para gestionar vistas adicionales
- **Forms**: Componentes modulares para nuevas funcionalidades
- **API Integration**: Patrón establecido para servicios externos

## 🔧 Integración con Servicios Externos

### Amazon QA (Ya Integrado)
```typescript
// Sistema existente de notificaciones
// Endpoint: /api/amazon-qa/notifications
// Estado: Activo y operativo
```

### Nuevas Integraciones (Preparado para)
- **Scripts Python**: Via API REST o procesos independientes
- **Servicios AWS**: Configuración modular para nuevos servicios
- **APIs Empresariales**: Patrón estándar de integración
- **Bases de Datos**: Configuración para persistencia de datos

## 📋 Cómo Agregar Nueva Funcionalidad

### Paso 1: Crear Formulario
```bash
# Crear nuevo componente en:
src/components/Forms/NuevaFuncionalidad.tsx
```

### Paso 2: Actualizar Dashboard
```typescript
// En src/pages/Dashboard.tsx

// 1. Agregar al enum ActiveView
type ActiveView = "dashboard" | "documents" | "quotes" | "notifications" | "nueva-funcionalidad";

// 2. Agregar al array services
const services = [
  // servicios existentes...
  {
    title: "Nueva Funcionalidad",
    description: "Descripción del nuevo servicio",
    icon: NuevoIcon,
    variant: "primary" as const,
    onClick: () => setActiveView("nueva-funcionalidad")
  }
];

// 3. Agregar case en renderActiveView()
case "nueva-funcionalidad":
  return <NuevaFuncionalidadForm onBack={() => setActiveView("dashboard")} />;
```

### Paso 3: Implementar Lógica de Negocio
```typescript
// src/services/nuevaFuncionalidadAPI.ts
export const callNuevaAPI = async (data: any) => {
  const response = await fetch('/api/nueva-funcionalidad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

## 🎨 Sistema de Diseño

### Colores Semánticos
- **Primary**: Azul corporativo (#3B82F6)
- **Secondary**: Verde éxito (#10B981)
- **Accent**: Grises profesionales
- **Warning/Success/Destructive**: Estados de aplicación

### Componentes UI
- Basado en **shadcn/ui** con personalización empresarial
- Diseño responsive y accesible
- Iconografía consistente con **Lucide React**

## 🔄 Estado Actual de Integraciones

| Servicio | Estado | Descripción |
|----------|--------|-------------|
| Amazon QA | ✅ **Activo** | Sistema de notificaciones (Visual Studio) |
| Python Scripts | ⚡ **Preparado** | Endpoint API configurado |
| AWS Services | ⚡ **Preparado** | Arquitectura modular lista |
| Bases de Datos | ⚡ **Preparado** | Persistencia de datos |

## 🚀 Tecnologías Utilizadas

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Estado**: React Hooks + Context
- **Build**: Vite

## 📖 Documentación Adicional

- Ver `src/components/Documentation/ExtensibilityGuide.tsx` para guía detallada
- Cada componente incluye documentación inline TypeScript
- Patrones de integración documentados en código

## 🔒 Consideraciones de Seguridad

- Validación de formularios en frontend y backend
- Manejo seguro de APIs externas
- Configuración de CORS para integraciones
- Logging de actividades para auditoría

---

**Desarrollado para**: Área de Contabilidad  
**Arquitectura**: Modular y Extensible  
**Integración**: Amazon QA + APIs Externas  
**Escalabilidad**: Preparado para crecimiento futuro