// =====================================================
// SUPABASE EDGE FUNCTION: send-email
// Función para enviar emails usando Resend
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'TASTY <onboarding@resend.dev>' // Dominio verificado de Resend

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
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email', 
          details: emailResult 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Email enviado exitosamente:', emailResult.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResult.id,
        message: 'Email sent successfully' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error en función send-email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

/* 
INSTRUCCIONES DE USO:

1. Desplegar función:
   supabase functions deploy send-email --project-ref aitmxnfljglwpkpibgek

2. Configurar variable de entorno en Supabase Dashboard:
   RESEND_API_KEY=tu_api_key_aqui

3. Probar función:
   curl -X POST https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"to":"test@email.com","subject":"Test","html":"<h1>Hola desde TASTY!</h1>"}'

4. Ver logs:
   supabase functions logs send-email --project-ref aitmxnfljglwpkpibgek
*/
