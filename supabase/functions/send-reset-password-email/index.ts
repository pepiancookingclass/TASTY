// =====================================================
// SUPABASE EDGE FUNCTION: send-reset-password-email
// Envía emails de recuperación de contraseña con diseño TASTY
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'https://aitmxnfljglwpkpibgek.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const FROM_EMAIL = 'TASTY <notifications@tasty.lat>'
const SITE_URL = 'https://tasty.lat'

interface ResetPasswordRequest {
  email: string
}

// =====================================================
// FUNCIÓN: Enviar email con Resend
// =====================================================
async function sendEmailWithResend(to: string, subject: string, html: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY no configurada')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    console.log(`📧 Enviando email a: ${to}`)
    console.log(`📧 Asunto: ${subject}`)
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Error de Resend:', result)
      return { success: false, error: JSON.stringify(result) }
    }

    console.log('✅ Email enviado exitosamente:', result.id)
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('❌ Error enviando email:', error)
    return { success: false, error: error.message }
  }
}

// =====================================================
// GENERAR TOKEN Y ENVIAR EMAIL
// =====================================================
async function processResetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  console.log(`\n🔐 ========================================`)
  console.log(`🔐 PROCESANDO RESET PASSWORD PARA: ${email}`)
  console.log(`🔐 ========================================\n`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // 1. Verificar que el usuario existe
    console.log('📋 Verificando usuario...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !userData) {
      console.log('⚠️ Usuario no encontrado, pero respondemos OK por seguridad')
      return { success: true }
    }

    console.log(`✅ Usuario encontrado: ${userData.name}`)

    // 2. Generar link de reset usando Supabase Auth Admin
    console.log('🔗 Generando link de recuperación...')
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${SITE_URL}/auth/reset-password`
      }
    })

    if (linkError) {
      console.error('❌ Error generando link:', linkError)
      return { success: false, error: linkError.message }
    }

    // Extraer el token del link generado
    const resetUrl = linkData.properties?.action_link || ''
    console.log('✅ Link generado correctamente')

    // 3. Enviar email personalizado
    const userName = userData.name || 'Usuario'
    const subject = '🔐 Recupera tu contraseña - TASTY'
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef3c7;">
        <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f59e0b; margin: 0; font-size: 28px;">🔐 Recupera tu Contraseña</h1>
          </div>
          
          <p style="font-size: 16px; color: #374151;">¡Hola <strong>${userName}</strong>!</p>
          
          <p style="font-size: 16px; color: #374151;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en TASTY.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #f59e0b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Restablecer Contraseña
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            Este enlace expirará en <strong>1 hora</strong> por seguridad.
          </p>
          
          <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; color: #92400e; margin: 0;">
              ⚠️ <strong>¿No solicitaste este cambio?</strong><br>
              Si no fuiste tú, puedes ignorar este email. Tu contraseña seguirá siendo la misma.
            </p>
          </div>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${resetUrl}" style="color: #f59e0b; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              <strong>Equipo TASTY</strong> 🍰<br>
              WhatsApp: +502 30635323
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `

    const emailResult = await sendEmailWithResend(email, subject, html)
    
    if (emailResult.success) {
      console.log('✅ Email de recuperación enviado exitosamente')
      return { success: true }
    } else {
      console.error('❌ Error enviando email:', emailResult.error)
      return { success: false, error: emailResult.error }
    }

  } catch (error) {
    console.error('❌ Error procesando reset password:', error)
    return { success: false, error: error.message }
  }
}

// =====================================================
// SERVE
// =====================================================
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const body: ResetPasswordRequest = await req.json()
    console.log(`\n📨 Solicitud recibida para: ${body.email}`)

    if (!body.email) {
      return new Response(
        JSON.stringify({ error: 'email es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await processResetPassword(body.email)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error procesando solicitud:', error)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Si el email existe, recibirás un enlace de recuperación.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
