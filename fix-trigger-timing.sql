-- Cambiar trigger a BEFORE para que se ejecute en la misma transacción
DROP TRIGGER IF EXISTS send_emails_on_order_creation ON orders;

CREATE TRIGGER send_emails_on_order_creation
  BEFORE INSERT ON orders  -- BEFORE en lugar de AFTER
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_order_emails();
