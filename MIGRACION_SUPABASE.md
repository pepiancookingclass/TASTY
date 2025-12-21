# Plan de Migración de Firebase a Supabase

## Fase 1: Configuración Inicial y Análisis

1. **Configuración de Supabase**
   - Crear cuenta y proyecto en Supabase
   - Configurar base de datos PostgreSQL
   - Configurar autenticación
   - Configurar almacenamiento

2. **Análisis de la Estructura Actual**
   - Mapear colecciones de Firestore a tablas SQL
   - Identificar reglas de seguridad
   - Documentar funciones de Firebase Functions
   - Identificar autenticación y usuarios

## Fase 2: Migración de Datos

1. **Estructura de Base de Datos**
   - Crear esquema SQL en Supabase
   - Definir relaciones entre tablas
   - Configurar políticas de RLS (Row Level Security)

2. **Migración de Datos**
   - Exportar datos de Firestore
   - Transformar datos a formato compatible con PostgreSQL
   - Importar datos a Supabase

## Fase 3: Autenticación y Autorización

1. **Configuración de Autenticación**
   - Migrar usuarios existentes
   - Configurar proveedores de autenticación
   - Actualizar flujos de registro/login

2. **Seguridad**
   - Configurar políticas RLS
   - Implementar reglas de negocio

## Fase 4: Backend y Lógica de Negocio

1. **Migración de Funciones**
   - Convertir Firebase Functions a Supabase Edge Functions
   - Actualizar webhooks

2. **Almacenamiento**
   - Migrar archivos de Firebase Storage a Supabase Storage
   - Actualizar referencias en la aplicación

## Fase 5: Actualización del Código

1. **Instalación de Dependencias**
   ```bash
   npm install @supabase/supabase-js
   # Eliminar dependencias de Firebase si es necesario
   ```

2. **Actualización de Servicios**
   - Crear cliente de Supabase
   - Actualizar consultas a la base de datos
   - Actualizar autenticación
   - Actualizar almacenamiento

## Fase 6: Pruebas

1. **Pruebas Unitarias**
   - Probar consultas a la base de datos
   - Verificar autenticación
   - Validar permisos

2. **Pruebas de Integración**
   - Probar flujos completos
   - Verificar sincronización en tiempo real

## Fase 7: Despliegue

1. **Preparación para Producción**
   - Configuración de variables de entorno
   - Configuración de CORS
   - Backup de datos

2. **Despliegue**
   - Desplegar aplicación actualizada
   - Monitorear logs y rendimiento

## Fase 8: Post-Migración

1. **Monitoreo**
   - Supervisar rendimiento
   - Verificar logs de errores

2. **Optimización**
   - Ajustar índices
   - Optimizar consultas
   - Revisar políticas de RLS

## Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Migración Firebase a Supabase](https://supabase.com/docs/guides/migrate/firebase)
- [Referencia de API de Supabase](https://supabase.com/docs/reference)

## Notas Importantes

1. Realizar copias de seguridad antes de cada cambio importante
2. Mantener Firebase activo durante la migración
3. Considerar un período de transición con ambos servicios
4. Documentar todos los cambios realizados
5. Capacitar al equipo en el uso de Supabase

## Estado de la Migración

- [x] Fase 1: Configuración Inicial y Análisis
- [ ] Fase 2: Migración de Datos (pendiente: crear tablas en Supabase)
- [x] Fase 3: Autenticación y Autorización (código migrado)
- [ ] Fase 4: Backend y Lógica de Negocio
- [x] Fase 5: Actualización del Código
- [ ] Fase 6: Pruebas
- [ ] Fase 7: Despliegue
- [ ] Fase 8: Post-Migración

## Registro de Cambios

| Fecha       | Descripción del Cambio | Responsable |
|-------------|------------------------|-------------|
| 2025-12-17 | Creación del documento | Asistente   |
| 2025-12-18 | Migración de código Firebase a Supabase: useUser, useUserRoles, SiteHeader, login, signup, profile, layout. Eliminado firebase-admin del package.json | Asistente   |
