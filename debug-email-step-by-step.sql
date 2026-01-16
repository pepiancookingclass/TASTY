-- =====================================================
-- DEBUG: PASO A PASO PARA ENCONTRAR EL PROBLEMA
-- =====================================================

-- 1. FUNCIÓN DE DEBUG CON MÁS INFORMACIÓN
CREATE OR REPLACE FUNCTION debug_email_send()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := '7fb64017297e842f59522ea46ee53bc38cf3ad66cbe628f';
  response_data TEXT;
  http_response RECORD;
BEGIN
  -- Hacer llamada HTTP y capturar respuesta
  SELECT * INTO http_response
  FROM extensions.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'to', 'ruajhostal@gmail.com',
      'subject', 'DEBUG Test TASTY',
      'html', '<h1>Email de debug</h1><p>Si recibes esto, la función funciona!</p>'
    )::text
  );

  -- Retornar información completa de la respuesta
  RETURN 'STATUS: ' || http_response.status || 
         ' | CONTENT: ' || COALESCE(http_response.content, 'NULL') ||
         ' | HEADERS: ' || COALESCE(http_response.headers::text, 'NULL');

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR COMPLETO: ' || SQLERRM;
END;
$$;

-- 2. VERIFICAR CONFIGURACIÓN DE RESEND
CREATE OR REPLACE FUNCTION check_resend_config()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := '7fb64017297e842f59522ea46ee53bc38cf3ad66cbe628f';
  http_response RECORD;
BEGIN
  -- Verificar si la API key es válida haciendo una llamada simple
  SELECT * INTO http_response
  FROM extensions.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'to', 'test@test.com',
      'subject', 'Config Test',
      'html', 'Test'
    )::text
  );

  RETURN 'RESEND CONFIG - Status: ' || http_response.status || 
         ' | Response: ' || SUBSTRING(COALESCE(http_response.content, 'NULL'), 1, 200);

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR CONFIG: ' || SQLERRM;
END;
$$;

-- 3. VERIFICAR SI LA EDGE FUNCTION ESTÁ ACTIVA
CREATE OR REPLACE FUNCTION check_edge_function()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := '7fb64017297e842f59522ea46ee53bc38cf3ad66cbe628f';
  http_response RECORD;
BEGIN
  -- Hacer una llamada GET para ver si la función responde
  SELECT * INTO http_response
  FROM extensions.http_get(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email'
  );

  RETURN 'EDGE FUNCTION - Status: ' || http_response.status || 
         ' | Content: ' || SUBSTRING(COALESCE(http_response.content, 'NULL'), 1, 100);

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR EDGE FUNCTION: ' || SQLERRM;
END;
$$;

-- =====================================================
-- EJECUTAR DIAGNÓSTICOS
-- =====================================================

-- Ejecutar todos los diagnósticos
SELECT 'TEST 1: Debug Email' as test, debug_email_send() as result
UNION ALL
SELECT 'TEST 2: Resend Config' as test, check_resend_config() as result  
UNION ALL
SELECT 'TEST 3: Edge Function' as test, check_edge_function() as result;




