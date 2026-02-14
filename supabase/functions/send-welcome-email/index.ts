// =====================================================
// SUPABASE EDGE FUNCTION: send-welcome-email
// VERSIÓN DEFINITIVA - Envía emails de bienvenida DIRECTAMENTE con Resend
// MISMO SISTEMA QUE send-email (que SÍ funciona)
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'https://aitmxnfljglwpkpibgek.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const FROM_EMAIL = 'TASTY <notifications@tasty.lat>'
const ADMIN_EMAIL = 'pepiancookingclass@gmail.com'

interface WelcomeEmailRequest {
  user_id?: string
}

// =====================================================
// FUNCIÓN: Formatear fecha a zona horaria Guatemala (UTC-6)
// =====================================================
function formatDateGuatemala(dateString: string | null): string {
  if (!dateString) return 'Fecha no especificada'
  
  try {
    const date = new Date(dateString)
    date.setHours(date.getHours() - 6)
    
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return 'Fecha no especificada'
  }
}

// =====================================================
// FUNCIÓN PRINCIPAL: Enviar email con Resend
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
// PROCESAR EMAILS DE BIENVENIDA
// =====================================================
async function processWelcomeEmails(userId: string): Promise<{ success: boolean; emailsSent: number; errors: string[] }> {
  console.log(`\n🚀 ========================================`)
  console.log(`🚀 PROCESANDO EMAILS DE BIENVENIDA PARA: ${userId}`)
  console.log(`🚀 ========================================\n`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const errors: string[] = []
  let emailsSent = 0

  try {
    // 1. OBTENER DATOS DEL USUARIO
    console.log('📋 Obteniendo datos del usuario...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('❌ Error obteniendo usuario:', userError)
      errors.push(`Error obteniendo usuario: ${userError?.message}`)
      return { success: false, emailsSent: 0, errors }
    }

    console.log(`✅ Usuario encontrado: ${userData.name}`)
    console.log(`   Email: ${userData.email}`)

    // Verificar si es creador
    const isCreator = userData.roles && userData.roles.includes('creator')
    console.log(`👤 Tipo de usuario: ${isCreator ? 'CREADOR' : 'CLIENTE'}`)

    // =====================================================
    // 2. EMAIL AL USUARIO (BIENVENIDA)
    // =====================================================
    console.log(`\n📧 ========================================`)
    console.log(`📧 ENVIANDO EMAIL DE BIENVENIDA AL USUARIO`)
    console.log(`📧 ========================================\n`)

    let userSubject: string
    let userHtml: string

    if (isCreator) {
      userSubject = '🎉 ¡Bienvenido a TASTY como Creador!'
      userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">🎉 ¡Bienvenido a TASTY como Creador!</h1>
          
          <p>¡Hola <strong>${userData.name}</strong>!</p>
          
          <p>Estamos emocionados de tenerte en nuestra plataforma. Como creador, podrás:</p>
          
          <h3 style="color: #f59e0b;">✨ BENEFICIOS PARA TI:</h3>
          <ul>
            <li>Vender tus productos artesanales</li>
            <li>Recibir 90% de las ganancias</li>
            <li>Crear combos colaborativos</li>
            <li>Gestionar tus pedidos fácilmente</li>
            <li>Acceso a analytics de ventas</li>
          </ul>
          
          <h3 style="color: #f59e0b;">🚀 PRÓXIMOS PASOS:</h3>
          <ol>
            <li>Completa tu perfil de creador</li>
            <li>Sube fotos de tu workspace</li>
            <li>Agrega tus primeros productos</li>
            <li>Crea ofertas especiales</li>
          </ol>
          
          <h3 style="color: #f59e0b;">📱 RECURSOS ÚTILES:</h3>
          <ul>
            <li>WhatsApp Soporte: +502 30635323</li>
          </ul>
          
          <p>¡Gracias por ser parte de la familia TASTY! 🍰</p>
          
          <hr>
          <p><strong>Equipo TASTY</strong><br>
          WhatsApp: +502 30635323</p>
        </div>
      `
    } else {
      userSubject = '🍰 ¡Bienvenido a TASTY!'
      userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">🍰 ¡Bienvenido a TASTY!</h1>
          
          <p>¡Hola <strong>${userData.name}</strong>!</p>
          
          <p>Gracias por unirte a nuestra comunidad de amantes de la comida artesanal.</p>
          
          <h3 style="color: #f59e0b;">✨ DESCUBRE TASTY:</h3>
          <ul>
            <li>Productos artesanales únicos</li>
            <li>Creadores locales talentosos</li>
            <li>Combos especiales colaborativos</li>
            <li>Entrega a domicilio</li>
          </ul>
          
          <h3 style="color: #f59e0b;">🎁 OFERTAS ESPECIALES:</h3>
          <p>¡Aprovecha nuestras ofertas de bienvenida!</p>
          
          <h3 style="color: #f59e0b;">💡 CONSEJO:</h3>
          <p>Completa tu perfil para una mejor experiencia de compra.</p>
          
          <p>¡Disfruta explorando TASTY! 🎉</p>
          
          <hr>
          <p><strong>Equipo TASTY</strong><br>
          WhatsApp: +502 30635323</p>
        </div>
      `
    }

    // Enviar al usuario real (fallback al admin si falta email)
    const userEmail = userData.email || ADMIN_EMAIL
    const userEmailResult = await sendEmailWithResend(userEmail, userSubject, userHtml)
    if (userEmailResult.success) {
      emailsSent++
      console.log('✅ EMAIL USUARIO ENVIADO')
    } else {
      errors.push(`Error email usuario: ${userEmailResult.error}`)
    }

    // =====================================================
    // 3. EMAIL AL ADMIN (NOTIFICACIÓN)
    // =====================================================
    console.log(`\n📧 ========================================`)
    console.log(`📧 ENVIANDO EMAIL AL ADMIN`)
    console.log(`📧 ========================================\n`)

    const adminSubject = isCreator 
      ? '🎨 Nuevo Creador Registrado - TASTY'
      : '👤 Nuevo Usuario Registrado - TASTY'

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">${isCreator ? '🎨 NUEVO CREADOR REGISTRADO' : '👤 NUEVO USUARIO REGISTRADO'}</h1>
        
        <h3>DATOS DEL USUARIO:</h3>
        <ul>
          <li><strong>Nombre:</strong> ${userData.name}</li>
          <li><strong>Email:</strong> ${userData.email}</li>
          <li><strong>Fecha:</strong> ${formatDateGuatemala(userData.created_at)}</li>
          <li><strong>Tipo:</strong> ${isCreator ? 'CREADOR' : 'CLIENTE'}</li>
        </ul>
        
        <hr>
        <p><strong>Sistema TASTY</strong><br>
        Notificación automática</p>
      </div>
    `

    const adminEmailResult = await sendEmailWithResend(ADMIN_EMAIL, adminSubject, adminHtml)
    if (adminEmailResult.success) {
      emailsSent++
      console.log('✅ EMAIL ADMIN ENVIADO')
    } else {
      errors.push(`Error email admin: ${adminEmailResult.error}`)
    }

    // =====================================================
    // RESULTADO FINAL
    // =====================================================
    console.log(`\n🎉 ========================================`)
    console.log(`🎉 PROCESAMIENTO COMPLETADO`)
    console.log(`🎉 ========================================`)
    console.log(`🎉 Emails enviados: ${emailsSent}`)
    console.log(`🎉 Errores: ${errors.length}`)

    return { success: errors.length === 0, emailsSent, errors }

  } catch (error) {
    console.error('❌ Error procesando emails de bienvenida:', error)
    errors.push(`Error general: ${error.message}`)
    return { success: false, emailsSent, errors }
  }
}

// =====================================================
// SERVE - MISMO PATRÓN QUE send-email
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
    const body: WelcomeEmailRequest = await req.json()
    console.log(`\n📨 Solicitud recibida:`, JSON.stringify(body))

    if (body.user_id) {
      console.log(`\n📨 Procesando emails de bienvenida para usuario: ${body.user_id}`)
      
      const result = await processWelcomeEmails(body.user_id)
      
      return new Response(
        JSON.stringify({
          success: result.success,
          message: result.success 
            ? `✅ ${result.emailsSent} emails de bienvenida enviados exitosamente`
            : `⚠️ ${result.emailsSent} emails enviados, ${result.errors.length} errores`,
          emailsSent: result.emailsSent,
          errors: result.errors
        }),
        {
          status: result.success ? 200 : 207,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'user_id es requerido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error procesando solicitud:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})