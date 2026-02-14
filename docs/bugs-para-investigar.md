# Bugs Resueltos

> **Nota:** Este archivo documenta bugs que YA FUERON RESUELTOS. No requieren acción.

## ✅ 1) Eliminación de productos bloquea la página
- **Estado:** ✅ RESUELTO (13 Feb 2026)
- **Causa raíz:** `DropdownMenu` de Radix no se cerraba al abrir `Dialog`
- **Fix:** Estado `openDropdownId` controla explícitamente el dropdown; se cierra antes de abrir el diálogo
- **Archivo:** `src/components/creator/ProductTable.tsx`

## ✅ 2) RLS order_items recursión infinita
- **Estado:** ✅ RESUELTO (13 Feb 2026)
- **Causa raíz:** Policies RLS con joins recursivos
- **Fix:** `OrderProvider.tsx` hace queries separadas sin joins
- **Archivo:** `src/context/OrderProvider.tsx`

---

*No se requieren más investigaciones. Todos los bugs críticos están resueltos.*
