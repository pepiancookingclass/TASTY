-- 🔍 SECCIÓN 6: VERIFICAR TABLA USER_CARTS (recién creada)
SELECT 
  id,
  user_id,
  cart_data,
  created_at,
  updated_at
FROM user_carts 
WHERE user_id = (SELECT id FROM users WHERE email = 'ruajhostal@gmail.com');

