-- Probar la función directamente en SQL Editor
SELECT send_order_confirmation_email('c0b9fd4a-39c5-4513-a6cb-100aeccda0eb');

-- Ver si la función existe y qué parámetros espera
SELECT routine_name, parameter_name, data_type 
FROM information_schema.parameters 
WHERE specific_name IN (
  SELECT specific_name 
  FROM information_schema.routines 
  WHERE routine_name = 'send_order_confirmation_email'
);
