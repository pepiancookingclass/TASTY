-- Crear usuario de prueba para debuggear el perfil
-- Ejecutar en Supabase SQL Editor

-- Insertar usuario de prueba
INSERT INTO users (
    id,
    name,
    email,
    phone,
    profile_picture_url,
    roles,
    skills,
    address_street,
    address_city,
    address_state,
    address_zip,
    address_country,
    workspace_photos,
    has_delivery,
    created_at,
    updated_at
) VALUES (
    '12345678-1234-1234-1234-123456789012', -- ID fijo para pruebas
    'María González Test', -- Nombre con tilde para probar
    'maria.test@example.com',
    '+502 1234-5678',
    'https://aitmxnfljglwpkpibgek.supabase.co/storage/v1/object/public/images/profiles/test-profile.jpg',
    ARRAY['customer', 'creator'], -- Roles como creador
    ARRAY['pastry', 'handmade'], -- Skills
    'Calle Test 123',
    'Ciudad de Guatemala',
    'Guatemala',
    '01010',
    'Guatemala',
    ARRAY[
        'https://aitmxnfljglwpkpibgek.supabase.co/storage/v1/object/public/images/workspace/test1.jpg',
        'https://aitmxnfljglwpkpibgek.supabase.co/storage/v1/object/public/images/workspace/test2.jpg'
    ],
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();





