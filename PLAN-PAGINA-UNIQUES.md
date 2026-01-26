# 👗 PLAN: PÁGINA DE UNIQUES (PRENDAS ÚNICAS)

## 🎯 CONCEPTO GENERAL

**Página dedicada a prendas únicas de ropa y accesorios creados por artesanos/creadores de TASTY.**

### 💡 IDEA PRINCIPAL:
- Expandir TASTY más allá de comida
- Incluir **ropa artesanal**, **accesorios únicos**, **joyería handmade**
- Misma filosofía: **Creadores locales, productos únicos, 90% para el creador**

---

## 🏗️ ESTRUCTURA TÉCNICA

### **1. BASE DE DATOS**

#### **Nueva Categoría de Productos:**
```sql
-- Agregar nuevos tipos de producto
ALTER TYPE product_type ADD VALUE 'clothing';
ALTER TYPE product_type ADD VALUE 'accessory'; 
ALTER TYPE product_type ADD VALUE 'jewelry';
ALTER TYPE product_type ADD VALUE 'textile';
```

#### **Campos Adicionales para Ropa:**
```sql
-- Agregar campos específicos para ropa
ALTER TABLE products 
ADD COLUMN sizes JSONB, -- ['XS', 'S', 'M', 'L', 'XL']
ADD COLUMN colors JSONB, -- ['Rojo', 'Azul', 'Verde']
ADD COLUMN materials TEXT[], -- ['Algodón', 'Lino', 'Seda']
ADD COLUMN care_instructions TEXT,
ADD COLUMN is_unique BOOLEAN DEFAULT false, -- Pieza única vs múltiples
ADD COLUMN stock_quantity INTEGER DEFAULT 1;
```

#### **Tabla de Variantes:**
```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(10),
  color VARCHAR(50),
  price_adjustment DECIMAL(8,2) DEFAULT 0, -- +/- precio base
  stock_quantity INTEGER DEFAULT 1,
  sku VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2. PÁGINAS NUEVAS**

#### **A. Página Pública: `/uniques`**
- **Grid de productos únicos** con filtros avanzados
- **Filtros**: Tipo, Talla, Color, Precio, Creador
- **Vista especial** para piezas únicas (badge "ÚNICA")

#### **B. Página Creador: `/creator/uniques`**
- **Gestión de productos de ropa/accesorios**
- **Formulario especializado** con campos de talla, color, materiales
- **Gestión de stock** y variantes

#### **C. Detalle de Producto: `/uniques/[id]`**
- **Galería de imágenes** múltiples
- **Selector de talla y color**
- **Información de cuidados**
- **Perfil del artesano**

---

## 🎨 FUNCIONALIDADES ESPECÍFICAS

### **1. PARA CREADORES:**

#### **Gestión de Productos Únicos:**
- ✅ **Subir múltiples fotos** (frente, atrás, detalles)
- ✅ **Configurar tallas disponibles** con stock por talla
- ✅ **Definir colores** y materiales
- ✅ **Marcar como pieza única** (solo 1 disponible)
- ✅ **Instrucciones de cuidado**

#### **Gestión de Stock:**
- ✅ **Control de inventario** por variante
- ✅ **Notificaciones** cuando se agote stock
- ✅ **Pausar/reactivar** productos automáticamente

### **2. PARA CLIENTES:**

#### **Experiencia de Compra:**
- ✅ **Filtros avanzados** (talla, color, precio, estilo)
- ✅ **Vista previa** de variantes en tiempo real
- ✅ **Información detallada** de materiales y cuidados
- ✅ **Galería interactiva** con zoom
- ✅ **Recomendaciones** de talla

#### **Carrito Especializado:**
- ✅ **Verificación de stock** en tiempo real
- ✅ **Reserva temporal** (15 min) para piezas únicas
- ✅ **Cálculo de envío** especial para ropa (peso/volumen)

---

## 🛍️ CATEGORÍAS PROPUESTAS

### **1. ROPA ARTESANAL**
- **Huipiles modernos**
- **Blusas bordadas**
- **Vestidos únicos**
- **Camisas de lino**
- **Faldas tradicionales**

### **2. ACCESORIOS**
- **Bolsos tejidos**
- **Cinturones de cuero**
- **Sombreros artesanales**
- **Bufandas bordadas**
- **Carteras únicas**

### **3. JOYERÍA**
- **Aretes de jade**
- **Collares de semillas**
- **Pulseras tejidas**
- **Anillos de plata**
- **Broches artesanales**

### **4. TEXTILES PARA HOGAR**
- **Manteles bordados**
- **Cojines decorativos**
- **Tapetes tejidos**
- **Cortinas artesanales**
- **Colchas únicas**

---

## 💰 MODELO DE NEGOCIO

### **MISMO SISTEMA QUE COMIDA:**
- ✅ **90% para el creador**
- ✅ **10% comisión TASTY**
- ✅ **Delivery calculado** por distancia
- ✅ **Pagos seguros**

### **CONSIDERACIONES ESPECIALES:**
- ✅ **Envío más caro** (prendas vs comida)
- ✅ **Tiempo de entrega** más largo (3-5 días)
- ✅ **Política de devoluciones** (7 días)
- ✅ **Verificación de calidad** por TASTY

---

## 🚀 IMPLEMENTACIÓN POR FASES

### **FASE 1: ESTRUCTURA BÁSICA (1-2 semanas)**
1. **Base de datos**: Agregar campos y tablas
2. **Página `/uniques`**: Grid básico con filtros
3. **Formulario creador**: Subida de productos de ropa
4. **Carrito**: Adaptación para variantes

### **FASE 2: FUNCIONALIDADES AVANZADAS (2-3 semanas)**
1. **Gestión de stock**: Control de inventario
2. **Galería múltiple**: Subida de varias fotos
3. **Filtros avanzados**: Talla, color, material
4. **Reserva temporal**: Para piezas únicas

### **FASE 3: OPTIMIZACIONES (1 semana)**
1. **Recomendaciones**: Tallas y productos similares
2. **Analytics**: Métricas específicas de ropa
3. **Notificaciones**: Stock bajo, nuevos productos
4. **SEO**: Optimización para búsquedas de ropa

---

## 🎯 VENTAJAS ESTRATÉGICAS

### **PARA TASTY:**
- ✅ **Diversificación** más allá de comida
- ✅ **Mayor ticket promedio** (ropa > comida)
- ✅ **Menos perecedero** (no se vence)
- ✅ **Mercado más amplio**

### **PARA CREADORES:**
- ✅ **Nuevos ingresos** para artesanos textiles
- ✅ **Plataforma especializada** en productos únicos
- ✅ **Misma comisión favorable** (90%)
- ✅ **Herramientas profesionales**

### **PARA CLIENTES:**
- ✅ **Productos únicos** no disponibles en tiendas
- ✅ **Apoyo directo** a artesanos locales
- ✅ **Calidad garantizada**
- ✅ **Historia detrás** de cada pieza

---

## ⚠️ CONSIDERACIONES Y RIESGOS

### **DESAFÍOS TÉCNICOS:**
- 🔴 **Gestión de stock** más compleja
- 🔴 **Múltiples fotos** por producto
- 🔴 **Variantes** (talla/color) en carrito
- 🔴 **Cálculo de envío** diferente

### **DESAFÍOS DE NEGOCIO:**
- 🔴 **Devoluciones** (no aplica en comida)
- 🔴 **Control de calidad** más subjetivo
- 🔴 **Competencia** con tiendas de ropa
- 🔴 **Educación del mercado**

### **RECURSOS NECESARIOS:**
- 🔴 **Desarrollo adicional**: 4-6 semanas
- 🔴 **Fotografía profesional**: Para productos
- 🔴 **Políticas nuevas**: Devoluciones, calidad
- 🔴 **Marketing específico**: Para ropa artesanal

---

## 📊 MÉTRICAS DE ÉXITO

### **KPIs PROPUESTOS:**
- **Número de creadores** de ropa registrados
- **Productos únicos** listados por mes
- **Ticket promedio** vs productos de comida
- **Tasa de devolución** (objetivo: <5%)
- **Tiempo promedio** en página de producto
- **Conversión** de vista a compra

---

## 🤔 RECOMENDACIÓN

### **¿IMPLEMENTAR O NO?**

#### **✅ PROS:**
- Diversifica el negocio
- Mercado grande en Guatemala (textiles)
- Diferenciación competitiva
- Mayor valor por transacción

#### **❌ CONTRAS:**
- Complejidad técnica adicional
- Recursos de desarrollo significativos
- Riesgos operacionales nuevos
- Distracción del core business (comida)

### **💡 SUGERENCIA:**
**Implementar en FASE 2** del proyecto, después de:
1. ✅ Consolidar el negocio de comida
2. ✅ Tener base sólida de usuarios
3. ✅ Equipo más grande para manejar complejidad
4. ✅ Validar demanda con encuestas/MVP

---

## 📋 CONCLUSIÓN

**La página de UNIQUES es una excelente idea estratégica**, pero requiere recursos significativos. 

**Recomendación: Documentar bien el plan y ejecutar después de consolidar el core business de comida.**

¿Proceder con la implementación ahora o mantener como plan futuro?





