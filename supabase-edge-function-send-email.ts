// =====================================================
// SUPABASE EDGE FUNCTION: send-email
// Archivo: supabase/functions/send-email/index.ts
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'TASTY <noreply@tasty.lat>' // Cambiar por dominio real

interface EmailRequest {
  to: string
  subject: string
  html: string
  from?: string
}

serve(async (req) => {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Verificar API key
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY no configurada')
      return new Response('Email service not configured', { status: 500 })
    }

    // Obtener datos del request
    const { to, subject, html, from }: EmailRequest = await req.json()

    // Validar campos requeridos
    if (!to || !subject || !html) {
      return new Response('Missing required fields: to, subject, html', { status: 400 })
    }

    console.log(`Enviando email a: ${to}, Asunto: ${subject}`)

    // Enviar email usando Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || FROM_EMAIL,
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('Error de Resend:', emailResult)
      return new Response(`Email service error: ${emailResult.message}`, { 
        status: emailResponse.status 
      })
    }

    console.log('Email enviado exitosamente:', emailResult.id)

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResult.id 
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error enviando email:', error)
    return new Response(`Internal server error: ${error.message}`, { 
      status: 500 
    })
  }
})

/* 
INSTRUCCIONES PARA DESPLEGAR:

1. Instalar Supabase CLI:
   npm install -g supabase

2. Inicializar proyecto (si no está hecho):
   supabase init

3. Crear la función:
   supabase functions new send-email

4. Reemplazar el contenido de supabase/functions/send-email/index.ts con este código

5. Desplegar la función:
   supabase functions deploy send-email --project-ref aitmxnfljglwpkpibgek

6. Configurar variables de entorno en Supabase Dashboard:
   - RESEND_API_KEY: Tu API key de Resend
   
7. Configurar secretos:
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxx --project-ref aitmxnfljglwpkpibgek

ALTERNATIVA CON NODEMAILER (si prefieres SMTP):

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com', // o tu proveedor SMTP
  port: 587,
  secure: false,
  auth: {
    user: Deno.env.get('SMTP_USER'),
    pass: Deno.env.get('SMTP_PASS')
  }
});

// En lugar de fetch a Resend:
await transporter.sendMail({
  from: FROM_EMAIL,
  to: to,
  subject: subject,
  html: html
});
*/




