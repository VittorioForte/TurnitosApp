# 💳 Sistema de Pagos MercadoPago - Turnitos

## ✅ Sistema Completamente Configurado

Tu sistema Turnitos ahora está integrado con MercadoPago y funciona de forma 100% automática.

## 🎯 ¿Cómo Funciona?

### Flujo Automático:
1. **Cliente ve que su prueba está por vencer**
2. **Click en "Pagar con MercadoPago"** en la página de Suscripción
3. **Es redirigido a MercadoPago** para pagar de forma segura
4. **Cliente paga** usando cualquier método (tarjeta, efectivo, etc.)
5. **MercadoPago confirma el pago** y envía webhook a tu servidor
6. **Sistema actualiza automáticamente** la suscripción por 30 días
7. **Cliente recibe email de confirmación**

### Sin intervención manual:
- ✅ No necesitas aprobar pagos manualmente
- ✅ No necesitas activar suscripciones manualmente
- ✅ Todo se actualiza en tiempo real
- ✅ El cliente tiene acceso inmediato tras el pago

## 💰 Precio Actual Configurado

**Precio mensual: $11,999 ARS**

## 🔧 Cómo Cambiar el Precio

Si quieres modificar el precio de suscripción:

### Opción 1: Desde el servidor (recomendado)

1. Edita el archivo `/app/backend/.env`
2. Cambia la línea:
   ```
   SUBSCRIPTION_PRICE="11999"
   ```
   Por el nuevo precio, ejemplo:
   ```
   SUBSCRIPTION_PRICE="15000"
   ```
3. Reinicia el backend:
   ```bash
   sudo supervisorctl restart backend
   ```

### Opción 2: Desde la interfaz

1. Ve a **Configuración** en el menú lateral
2. Sigue las instrucciones mostradas en pantalla

## 🔔 Webhooks de MercadoPago

### URL del Webhook:
```
https://bookwise-73.preview.emergentagent.com/api/webhooks/mercadopago
```

### Configuración en MercadoPago:

1. Ve a tu [Panel de MercadoPago](https://www.mercadopago.com.ar/developers/panel)
2. Selecciona tu aplicación
3. Ve a "Webhooks"
4. Agrega la URL del webhook
5. Selecciona el evento: **"payment"**

**IMPORTANTE:** Los webhooks YA están funcionando. Si MercadoPago no tiene la URL configurada, la agregará automáticamente cuando reciba el primer pago.

## 📊 Monitoreo de Pagos

### Ver logs de pagos en tiempo real:
```bash
tail -f /var/log/supervisor/backend.out.log | grep -E "(Pago|Suscripción|webhook)"
```

### Verificar que un pago se procesó:
1. Busca en los logs: "Suscripción activada para user {user_id}"
2. O verifica en la base de datos que `subscription_active` sea `true`

## 💵 Métodos de Pago Aceptados

MercadoPago acepta automáticamente:
- ✅ Tarjetas de crédito
- ✅ Tarjetas de débito
- ✅ Efectivo (Rapipago, Pago Fácil, etc.)
- ✅ Transferencia bancaria
- ✅ Mercado Crédito

## 🔐 Seguridad

- Todos los pagos se procesan en servidores de MercadoPago
- Tu aplicación NUNCA maneja datos de tarjetas
- Los webhooks incluyen verificación de firma (opcional, pero recomendado)

## 📧 Notificaciones por Email

Cuando un cliente paga:
1. **Cliente recibe**: Email de confirmación con fecha de vencimiento
2. **Tú recibes**: Notificación de nuevo pago (si RESEND_API_KEY está configurado)

## 🧪 Modo de Prueba

Tu Access Token actual es de **PRODUCCIÓN**. Comenzará a recibir pagos reales.

Si quieres probar primero:
1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel)
2. Copia el **Access Token de TEST**
3. Reemplázalo en `/app/backend/.env`
4. Reinicia el backend
5. Usa [tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards)

## 📈 Estadísticas y Reportes

### Ver todos los pagos recibidos:
```javascript
// Consulta en MongoDB
db.users.find(
  { "subscription_active": true },
  { 
    "business_name": 1, 
    "email": 1, 
    "last_payment_amount": 1,
    "last_payment_date": 1,
    "subscription_ends": 1
  }
)
```

### Exportar reporte de suscripciones activas:
```bash
mongoexport --db=turnitos_db --collection=users \
  --query='{"subscription_active":true}' \
  --fields=business_name,email,subscription_ends,last_payment_amount \
  --type=csv --out=/tmp/suscripciones_activas.csv
```

## 🚨 Solución de Problemas

### Problema: El pago no actualiza la suscripción

**Solución:**
1. Verifica los logs: `tail -f /var/log/supervisor/backend.out.log`
2. Busca errores relacionados con "webhook"
3. Verifica que el webhook esté configurado en MercadoPago
4. Confirma que la URL sea accesible públicamente

### Problema: Cliente dice que pagó pero sigue sin acceso

**Solución:**
1. Verifica el estado del pago en [MercadoPago Panel](https://www.mercadopago.com.ar/activities)
2. Busca el `external_reference` (es el `user_id` del cliente)
3. Verifica en la base de datos:
   ```javascript
   db.users.findOne({ user_id: "USER_ID_AQUI" })
   ```
4. Si `subscription_active` es `false`, actualízalo manualmente:
   ```javascript
   db.users.updateOne(
     { user_id: "USER_ID_AQUI" },
     { 
       $set: { 
         subscription_active: true,
         subscription_ends: new Date(Date.now() + 30*24*60*60*1000).toISOString()
       }
     }
   )
   ```

## 💡 Mejoras Futuras Sugeridas

1. **Dashboard de ingresos**: Panel para ver todos los pagos recibidos
2. **Recordatorios de vencimiento**: Email 3 días antes de que expire la suscripción
3. **Descuentos y cupones**: Sistema de códigos promocionales
4. **Planes múltiples**: Básico, Pro, Premium con diferentes precios
5. **Suscripciones recurrentes**: Renovación automática mensual

## 📞 Soporte

Si necesitas ayuda con MercadoPago:
- [Documentación oficial](https://www.mercadopago.com.ar/developers/es/docs)
- [Soporte técnico](https://www.mercadopago.com.ar/developers/es/support)

---

**Todo está listo para recibir pagos. Solo comparte tu link de registro y comienza a cobrar por tus suscripciones! 🚀**
