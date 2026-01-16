-- =====================================================
-- SOLUCIÓN FINAL: REEMPLAZAR ADMIN CORRUPTO
-- =====================================================

-- 1. DAR PERMISOS DE ADMIN AL USUARIO QUE FUNCIONA
UPDATE public.users 
SET roles = ARRAY['admin'] 
WHERE email = 'ruajhostal@gmail.com';

-- 2. VERIFICAR QUE TIENE PERMISOS DE ADMIN
SELECT 
  'NUEVO_ADMIN' as resultado,
  email,
  roles,
  'admin' = ANY(roles) as es_admin
FROM public.users 
WHERE email = 'ruajhostal@gmail.com';

-- 3. OPCIONAL: ELIMINAR EL ADMIN CORRUPTO (SI QUIERES LIMPIAR)
-- DELETE FROM public.users WHERE email = 'pepiancookingclass@gmail.com';
-- DELETE FROM auth.users WHERE email = 'pepiancookingclass@gmail.com';

-- =====================================================
-- RESULTADO:
-- - ruajhostal@gmail.com ahora es ADMIN
-- - pepiancookingclass@gmail.com queda como usuario corrupto (ignorar)
-- - Sistema funcional con nuevo admin
-- =====================================================



