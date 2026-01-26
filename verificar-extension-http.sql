-- Verificar si extensión HTTP está habilitada
SELECT * FROM pg_extension WHERE extname = 'http';

-- Si no está, habilitarla
CREATE EXTENSION IF NOT EXISTS http;

