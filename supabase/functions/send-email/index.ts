// =====================================================
// SUPABASE EDGE FUNCTION: send-email
// VERSIÓN DEFINITIVA - Envía emails DIRECTAMENTE con Resend
// NO depende de triggers SQL ni funciones http()
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'https://aitmxnfljglwpkpibgek.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const FROM_EMAIL = 'TASTY <notifications@tasty.lat>'
const ADMIN_EMAIL = 'pepiancookingclass@gmail.com' // Email verificado en Resend

interface EmailRequest {
  to?: string
  subject?: string
  html?: string
  from?: string
  order_uuid?: string
}

// =====================================================
// FUNCIÓN: Formatear fecha a zona horaria Guatemala (UTC-6)
// =====================================================
function formatDateGuatemala(dateString: string | null, includeTime: boolean = true): string {
  if (!dateString) return 'Fecha no especificada'
  
  try {
    const date = new Date(dateString)
    // Restar 6 horas para Guatemala (UTC-6)
    date.setHours(date.getHours() - 6)
    
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    if (!includeTime) {
      return `${day}/${month}/${year}`
    }
    
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return 'Fecha no especificada'
  }
}

// =====================================================
// FUNCIÓN: Obtener fecha/hora actual en Guatemala
// =====================================================
function getCurrentDateGuatemala(): string {
  const now = new Date()
  now.setHours(now.getHours() - 6)
  
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
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
// PROCESAR EMAILS DE ORDEN COMPLETA
// =====================================================
async function processOrderEmails(orderUuid: string): Promise<{ success: boolean; emailsSent: number; errors: string[] }> {
  console.log(`\n🚀 ========================================`)
  console.log(`🚀 PROCESANDO EMAILS PARA ORDEN: ${orderUuid}`)
  console.log(`🚀 ========================================\n`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const errors: string[] = []
  let emailsSent = 0

  try {
    // 1. OBTENER DATOS DE LA ORDEN
    console.log('📋 Obteniendo datos de la orden...')
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        customer_name,
        customer_phone,
        total,
        subtotal,
        iva_amount,
        delivery_fee,
        delivery_breakdown,
        status,
        delivery_street,
        delivery_city,
        delivery_state,
        delivery_notes,
        delivery_date,
        payment_method,
        created_at,
        users!orders_user_id_fkey (
          name,
          email,
          phone
        )
      `)
      .eq('id', orderUuid)
      .single()

    if (orderError || !orderData) {
      console.error('❌ Error obteniendo orden:', orderError)
      return { success: false, emailsSent: 0, errors: [`Orden no encontrada: ${orderUuid}`] }
    }

    // Extraer datos del usuario
    const userData = orderData.users as any
    const order = {
      ...orderData,
      customer_name: orderData.customer_name || userData?.name || 'Cliente',
      customer_email: userData?.email || ADMIN_EMAIL,
      customer_phone: orderData.customer_phone || userData?.phone || 'No especificado',
    }

    console.log(`✅ Orden encontrada: ${order.id}`)
    console.log(`   Cliente: ${order.customer_name}`)
    console.log(`   Total: Q${order.total}`)

    // 2. OBTENER ITEMS DEL PEDIDO CON PRODUCTOS Y CREADORES
    console.log('\n📦 Obteniendo items del pedido...')
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        product_id,
        quantity,
        unit_price,
        product_name_es,
        product_name_en,
        delivery_vehicle,
        products (
          id,
          name_es,
          preparation_time,
          creator_id,
          users!products_creator_id_fkey (
            id,
            name,
            email
          )
        )
      `)
      .eq('order_id', orderUuid)

    if (itemsError) {
      console.error('❌ Error obteniendo items:', itemsError)
      errors.push(`Error obteniendo items: ${itemsError.message}`)
    }

    const items = orderItems || []
    console.log(`✅ Items encontrados: ${items.length}`)

    // 3. CONSTRUIR INFORMACIÓN
    const fullAddress = [order.delivery_street, order.delivery_city, order.delivery_state]
      .filter(Boolean)
      .join(', ') || 'Dirección no especificada'

    const formattedDelivery = formatDateGuatemala(order.delivery_date)
    const formattedNow = getCurrentDateGuatemala()

    // Construir lista de productos completa (sin duplicar precio cuando qty=1)
    const productsListHtml = items.map(item => {
      const name = item.product_name_es || (item.products as any)?.name_es || 'Producto'
      const qty = item.quantity
      const price = item.unit_price
      const total = qty * price
      // Truncar nombre si es muy largo
      const shortName = name.length > 35 ? name.substring(0, 32) + '...' : name
      return `   ${qty}× ${shortName} .......... Q${total.toFixed(0)}`
    }).join('<br>')

    // Desglose global
    const globalSubtotal = typeof order.subtotal === 'number' ? order.subtotal : items.reduce((s, it) => s + it.quantity * it.unit_price, 0)
    const globalIva = typeof order.iva_amount === 'number' ? order.iva_amount : globalSubtotal * 0.12
    const globalDelivery = typeof order.delivery_fee === 'number' ? order.delivery_fee : 0

    // Agrupar items por creador
    const creatorMap = new Map<string, {
      id: string
      name: string
      email: string
      items: typeof items
      subtotal: number
      totalHours: number
      deliveryFee: number
      vehicle: string
    }>()

    items.forEach(item => {
      const product = item.products as any
      const creator = product?.users as any
      if (creator?.id) {
        if (!creatorMap.has(creator.id)) {
          // Buscar delivery fee y vehicle del breakdown si existe
          let creatorDeliveryFee = 0
          let creatorVehicle = 'moto' // default
          if (order.delivery_breakdown && Array.isArray(order.delivery_breakdown)) {
            const breakdown = order.delivery_breakdown.find((b: any) => b.creator_id === creator.id)
            if (breakdown) {
              creatorDeliveryFee = breakdown.delivery_fee || 0
              creatorVehicle = breakdown.vehicle || 'moto'
            }
          }
          
          creatorMap.set(creator.id, {
            id: creator.id,
            name: creator.name || 'Creador',
            email: creator.email || '',
            items: [],
            subtotal: 0,
            totalHours: 0,
            deliveryFee: creatorDeliveryFee,
            vehicle: creatorVehicle
          })
        }
        const creatorData = creatorMap.get(creator.id)!
        creatorData.items.push(item)
        creatorData.subtotal += item.quantity * item.unit_price
        creatorData.totalHours += (product?.preparation_time || 0) * item.quantity
        // Si algún item requiere auto, actualizar el vehículo del creador
        if ((item as any).delivery_vehicle === 'auto') {
          creatorData.vehicle = 'auto'
        }
      }
    })

    // Si no hay breakdown, dividir delivery equitativamente
    if (!order.delivery_breakdown || !Array.isArray(order.delivery_breakdown) || order.delivery_breakdown.length === 0) {
      const totalDelivery = order.delivery_fee || 0
      const numCreators = creatorMap.size || 1
      const deliveryPerCreator = totalDelivery / numCreators
      
      creatorMap.forEach(creator => {
        creator.deliveryFee = deliveryPerCreator
      })
    }

    // Calcular totales
    const totalSubtotal = Array.from(creatorMap.values()).reduce((sum, c) => sum + c.subtotal, 0)
    const totalHours = Array.from(creatorMap.values()).reduce((sum, c) => sum + c.totalHours, 0)
    const numCreators = creatorMap.size

    // =====================================================
    // EMAIL 1: CLIENTE - Con desglose por creador
    // =====================================================
    console.log('\n📧 ========================================')
    console.log('📧 ENVIANDO EMAIL AL CLIENTE')
    console.log('📧 ========================================')

    // Construir sección de entregas por creador (con productos y desglose)
    let clientDeliveriesSection = ''
    if (numCreators > 1) {
      clientDeliveriesSection = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br>`
      clientDeliveriesSection += `🚚 <strong>ENTREGAS (${numCreators} por separado):</strong><br>`
      clientDeliveriesSection += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br><br>`
      
      creatorMap.forEach(creator => {
        const creatorIva = creator.subtotal * 0.12
        const creatorTotal = creator.subtotal + creatorIva + creator.deliveryFee
        const vehicleText = creator.vehicle === 'auto' ? 'Auto' : 'Moto'
        
        // Obtener zona del creador desde delivery_breakdown
        let creatorZone = ''
        if (order.delivery_breakdown && Array.isArray(order.delivery_breakdown)) {
          const breakdown = order.delivery_breakdown.find((b: any) => b.creator_id === creator.id)
          if (breakdown?.creator_zone) {
            creatorZone = ` desde ${breakdown.creator_zone}`
          }
        }
        
        clientDeliveriesSection += `📦 <strong>${creator.name.toUpperCase()}</strong> (${vehicleText}${creatorZone})<br>`
        
        // Lista de productos de este creador
        creator.items.forEach(item => {
          const name = item.product_name_es || (item.products as any)?.name_es || 'Producto'
          const shortName = name.length > 30 ? name.substring(0, 27) + '...' : name
          const total = item.quantity * item.unit_price
          clientDeliveriesSection += `   ${item.quantity}× ${shortName} .......... Q${total.toFixed(0)}<br>`
        })
        
        clientDeliveriesSection += `   ─────<br>`
        clientDeliveriesSection += `   Productos ................. Q${creator.subtotal.toFixed(0)}<br>`
        clientDeliveriesSection += `   IVA (12%) .................. Q${creatorIva.toFixed(0)}<br>`
        clientDeliveriesSection += `   Delivery ................... Q${creator.deliveryFee.toFixed(0)}<br>`
        clientDeliveriesSection += `   ═════════════════════════<br>`
        clientDeliveriesSection += `   💰 <strong>Pagarás: Q${creatorTotal.toFixed(0)}</strong><br><br>`
      })
    } else {
      clientDeliveriesSection = ''
    }

    const clientSubject = `🎉 Pedido Confirmado #${orderUuid.substring(0, 8)} - TASTY`
    
    // Formato de fecha más legible
    const dateCreated = formattedNow.split(' ')[0] || formattedNow
    const dateDelivery = formattedDelivery.split(' ')[0] || formattedDelivery
    
    const clientHtml = `
      <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; background: #fffbeb; padding: 20px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #f59e0b; margin: 0;">🎉 ¡Pedido Confirmado!</h1>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
          <pre style="margin: 0; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 <strong>PEDIDO #${orderUuid.substring(0, 8)}</strong>
   ${dateCreated} • Entrega: ${dateDelivery}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 <strong>ENTREGA:</strong>
   ${order.delivery_street || 'Dirección no especificada'}
   ${order.delivery_city || ''}, ${order.delivery_state || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 <strong>TUS PRODUCTOS:</strong>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${productsListHtml}
                                  ─────
   Subtotal ................. Q${globalSubtotal.toFixed(0)}
   IVA (12%) .................. Q${globalIva.toFixed(0)}

${clientDeliveriesSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   <strong>TOTAL PEDIDO ............ Q${order.total.toFixed(0)}</strong>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${numCreators > 1 ? `📝 <strong>IMPORTANTE:</strong>
   • Recibirás ${numCreators} entregas en momentos diferentes
   • Cada creador te cobrará solo por sus productos
   • Paga en efectivo a cada uno cuando llegue

` : ''}📱 <strong>PRÓXIMOS PASOS:</strong>
   1. Envía el WhatsApp desde "Mis Pedidos" para
      coordinar tu entrega con nuestro agente
   2. Los creadores prepararán tu pedido con amor
   3. Continuaremos la comunicación para confirmar
      fecha y hora de cada entrega
   4. ¡Disfruta tus productos artesanales!

   💡 ¿Ya enviaste el WhatsApp? Omite el paso 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
¡Gracias por elegir TASTY! 🍰
WhatsApp: +502 3063-5323
          </pre>
        </div>
      </div>
    `

    // Para ver el correo de cliente en sandbox, enviamos al ADMIN_EMAIL (Resend limita destinos no verificados)
    const clientResult = await sendEmailWithResend(order.customer_email || ADMIN_EMAIL, clientSubject, clientHtml)
    if (clientResult.success) {
      emailsSent++
      console.log('✅ EMAIL CLIENTE ENVIADO')
    } else {
      errors.push(`Error email cliente: ${clientResult.error}`)
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    // =====================================================
    // EMAIL 2: ADMIN - Con desglose financiero por creador
    // =====================================================
    console.log('\n📧 ========================================')
    console.log('📧 ENVIANDO EMAIL AL ADMIN')
    console.log('📧 ========================================')

    // Construir sección de productos global para admin
    const adminProductsSection = `
      🛍️ <strong>PRODUCTOS DEL PEDIDO:</strong><br>
      ${productsListHtml || 'Sin productos'}<br><br>
    `

    // Construir sección de creadores para admin
    let adminCreatorsSection = '👥 <strong>CREADORES Y PAGOS SEPARADOS:</strong><br><br>'
    let totalComisionTasty = 0
    
    creatorMap.forEach(creator => {
      const creatorIva = creator.subtotal * 0.12
      const creatorTotal = creator.subtotal + creatorIva + creator.deliveryFee
      const ganancia90 = creator.subtotal * 0.9
      const comisionTasty = creator.subtotal * 0.1
      totalComisionTasty += comisionTasty
      const vehicleText = creator.vehicle === 'auto' ? 'Auto' : 'Moto'
      
      adminCreatorsSection += `📦 <strong>${creator.name.toUpperCase()}:</strong><br>`
      adminCreatorsSection += `• Productos: Q${creator.subtotal.toFixed(2)} | Ganancia (90%): Q${ganancia90.toFixed(2)} | Comisión TASTY: Q${comisionTasty.toFixed(2)}<br>`
      adminCreatorsSection += `• Delivery (${vehicleText}): Q${creator.deliveryFee.toFixed(2)} | IVA (12%): Q${creatorIva.toFixed(2)}<br>`
      adminCreatorsSection += `• ITEMS:<br>`
      adminCreatorsSection += creator.items.map(it => {
        const name = it.product_name_es || (it.products as any)?.name_es || 'Producto'
        const total = it.quantity * it.unit_price
        return `  - ${it.quantity}x ${name} - Q${it.unit_price.toFixed(2)} (Q${total.toFixed(2)})`
      }).join('<br>')
      adminCreatorsSection += `<br>`
      adminCreatorsSection += `• <strong>CLIENTE PAGA A ${creator.name.toUpperCase()}: Q${creatorTotal.toFixed(2)}</strong><br><br>`
    })

    const adminSubject = `🚨 [ADMIN] Nuevo Pedido #${orderUuid.substring(0, 8)}`
    const adminHtml = `
      🚨 <strong>NUEVO PEDIDO RECIBIDO</strong><br><br>
      📋 <strong>INFORMACIÓN DEL PEDIDO:</strong><br>
      • Número: #${orderUuid.substring(0, 8)}<br>
      • Fecha: ${formattedNow}<br>
      • Estado: ${order.status}<br><br>
      👤 <strong>DATOS DEL CLIENTE:</strong><br>
      • Nombre: ${order.customer_name}<br>
      • Email: ${order.customer_email}<br>
      • Teléfono: ${order.customer_phone}<br><br>
      ${adminProductsSection}
      💰 <strong>DESGLOSE FINANCIERO ADMINISTRATIVO:</strong><br><br>
      ${adminCreatorsSection}
      📊 <strong>RESUMEN ADMINISTRATIVO:</strong><br>
      • Total pedido: Q${order.total.toFixed(2)}<br>
      • Total comisiones TASTY: Q${totalComisionTasty.toFixed(2)}<br>
      • Entregas separadas: ${numCreators}<br><br>
      📍 <strong>LOGÍSTICA DE ENTREGA:</strong><br>
      • Dirección: ${fullAddress}<br>
      • Fecha programada: ${formattedDelivery}<br>
      • Tiempo total preparación: ${totalHours} horas<br>
      • Notas: ${order.delivery_notes || 'Sin notas'}<br><br>
      ⚡ <strong>ACCIONES ADMINISTRATIVAS REQUERIDAS:</strong><br>
      1. Confirmar pedido con cliente<br>
      2. Coordinar con todos los creadores<br>
      3. Programar logística de entrega<br>
      4. Monitorear preparación y tiempos<br><br>
      📊 <strong>CONTROL NUMÉRICO:</strong><br>
      • ID Orden: ${orderUuid}<br>
      • Total productos: ${items.length}<br>
      • Total creadores: ${numCreators}<br><br>
      ---<br>
      Panel Admin: https://tasty.lat/admin<br>
      Sistema TASTY - Control Administrativo
    `

    const adminResult = await sendEmailWithResend(ADMIN_EMAIL, adminSubject, adminHtml)
    if (adminResult.success) {
      emailsSent++
      console.log('✅ EMAIL ADMIN ENVIADO')
    } else {
      errors.push(`Error email admin: ${adminResult.error}`)
    }

    // =====================================================
    // EMAILS 3+: CREADORES - Con toda la info financiera
    // =====================================================
    console.log('\n📧 ========================================')
    console.log('📧 ENVIANDO EMAILS A CREADORES')
    console.log('📧 ========================================')

    for (const [creatorId, creatorData] of creatorMap) {
      console.log(`\n👤 Procesando creador: ${creatorData.name} (${creatorId})`)

      await new Promise(resolve => setTimeout(resolve, 1000))

      // Calcular finanzas del creador
      const creatorIva = creatorData.subtotal * 0.12
      const creatorTotal = creatorData.subtotal + creatorIva + creatorData.deliveryFee
      const ganancia90 = creatorData.subtotal * 0.9
      const comisionTasty = creatorData.subtotal * 0.1
      const vehicleText = creatorData.vehicle === 'auto' ? 'Auto' : 'Moto'

      // Construir lista de productos del creador
      const creatorProductsList = creatorData.items.map(item => {
        const product = item.products as any
        const prepTime = product?.preparation_time || 0
        return `• ${item.product_name_es || product?.name_es || 'Producto'} (Cantidad: ${item.quantity}) - Q${(item.quantity * item.unit_price).toFixed(2)} | Tiempo: ${prepTime}h`
      }).join('<br>')

      const creatorSubject = `🎉 Nuevo Pedido #${orderUuid.substring(0, 8)} - TASTY`
      
      // Lista de productos formateada
      const creatorProductsFormatted = creatorData.items.map(item => {
        const product = item.products as any
        const name = item.product_name_es || product?.name_es || 'Producto'
        const shortName = name.length > 30 ? name.substring(0, 27) + '...' : name
        const total = item.quantity * item.unit_price
        return `   ${item.quantity}× ${shortName} .......... Q${total.toFixed(0)}`
      }).join('<br>')
      
      const creatorHtml = `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; background: #fffbeb; padding: 20px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #f59e0b; margin: 0;">🎉 ¡Nuevo Pedido!</h1>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <pre style="margin: 0; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
¡Hola <strong>${creatorData.name}</strong>!

Tienes un nuevo pedido de <strong>${order.customer_name}</strong>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 <strong>PEDIDO #${orderUuid.substring(0, 8)}</strong>
   ${formattedNow}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <strong>CLIENTE:</strong>
   ${order.customer_name}
   📞 ${order.customer_phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <strong>TUS PRODUCTOS:</strong>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${creatorProductsFormatted}
                                  ─────
   Productos ................. Q${creatorData.subtotal.toFixed(0)}
   IVA (12%) .................. Q${creatorIva.toFixed(0)}
   Delivery (${vehicleText}) ............. Q${creatorData.deliveryFee.toFixed(0)}
   ═════════════════════════════════
   💰 <strong>CLIENTE TE PAGA: Q${creatorTotal.toFixed(0)}</strong>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏦 <strong>TUS GANANCIAS:</strong>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Tu ganancia (90%) ........ Q${ganancia90.toFixed(0)}
   Comisión TASTY (10%) ...... Q${comisionTasty.toFixed(0)}
   Tiempo preparación ....... ${creatorData.totalHours}h

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 <strong>ENTREGA:</strong>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ${order.delivery_street || 'Dirección no especificada'}
   ${order.delivery_city || ''}, ${order.delivery_state || ''}
   Fecha: ${formattedDelivery}
   ${order.delivery_notes ? `Notas: ${order.delivery_notes}` : ''}

${numCreators > 1 ? `⚠️ <strong>PEDIDO MULTI-CREADOR:</strong>
   El cliente pagará a cada creador por
   separado. Él sabe que te paga Q${creatorTotal.toFixed(0)}

` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 <strong>PRÓXIMOS PASOS:</strong>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. Prepara tus productos
   2. Coordinaremos fecha/hora de entrega
   3. Cliente te paga Q${creatorTotal.toFixed(0)} en efectivo
   4. Transfiere Q${comisionTasty.toFixed(0)} (10%) a TASTY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
¡Gracias por ser parte de TASTY! 🍰
Panel: tasty.lat/creator
WhatsApp: +502 3063-5323
            </pre>
          </div>
        </div>
      `

      const creatorResult = await sendEmailWithResend(creatorData.email || ADMIN_EMAIL, creatorSubject, creatorHtml)
      if (creatorResult.success) {
        emailsSent++
        console.log(`✅ EMAIL CREADOR ${creatorData.name} ENVIADO`)
      } else {
        errors.push(`Error email creador ${creatorData.name}: ${creatorResult.error}`)
      }
    }

    // =====================================================
    // RESUMEN FINAL
    // =====================================================
    console.log('\n🎉 ========================================')
    console.log(`🎉 PROCESAMIENTO COMPLETADO`)
    console.log(`🎉 Emails enviados: ${emailsSent}`)
    console.log(`🎉 Errores: ${errors.length}`)
    console.log('🎉 ========================================\n')

    return { success: errors.length === 0, emailsSent, errors }

  } catch (error) {
    console.error('❌ Error general procesando emails:', error)
    return { success: false, emailsSent, errors: [...errors, error.message] }
  }
}

// =====================================================
// HANDLER PRINCIPAL
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
    const body: EmailRequest = await req.json()

    if (body.order_uuid) {
      console.log(`\n📨 Solicitud recibida para orden: ${body.order_uuid}`)
      
      const result = await processOrderEmails(body.order_uuid)
      
      return new Response(
        JSON.stringify({
          success: result.success,
          message: result.success 
            ? `✅ ${result.emailsSent} emails enviados exitosamente`
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

    const { to, subject, html } = body

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html OR order_uuid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Email individual a: ${to}`)
    const result = await sendEmailWithResend(to, subject, html)

    if (result.success) {
      return new Response(
        JSON.stringify({ success: true, messageId: result.messageId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('❌ Error en función send-email:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
