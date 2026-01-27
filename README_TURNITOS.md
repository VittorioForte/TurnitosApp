# 🐝 TURNITOS - Sistema de Gestión de Turnos

Sistema completo de gestión y reserva de turnos para negocios (barberías, estéticas, consultorios).

## ✨ Características Principales

### Panel Administrativo
- **Registro con 7 días de prueba gratis** automática
- **Dashboard** con estadísticas en tiempo real
- **CRUD de Servicios** (crear, editar, desactivar) con precios y duración
- **Configuración de Horarios** por día de la semana
- **Gestión de Turnos** (ver, crear, cancelar)
- **Link Público Compartible** para que clientes reserven
- **Sistema de Suscripción** con contador de días de prueba

### Página Pública de Reservas
- **Sin necesidad de registro** para clientes
- **Vista de servicios** con precios visibles
- **Calendario interactivo** con disponibilidad en tiempo real
- **Reserva fácil** con nombre, teléfono y email
- **Confirmación inmediata** por email
- **Diseño mobile-first** optimizado para WhatsApp

### Notificaciones por Email
- Confirmación al cliente cuando reserva
- Notificación al dueño de nuevos turnos
- Sistema de recordatorios (configurado)

## 🎨 Diseño

- **Tema "The Industrial Hive"** (Abeja)
- **Colores**: Amarillo (#FFD60A) y Negro (#18181B)
- **Tipografía**: Barlow Condensed (headings) + Manrope (body)
- **Estilo**: Profesional corporativo con "hard shadows"

## 🚀 Cómo Usar

### 1. Registro
1. Accede a `/register`
2. Completa: nombre del negocio, email y contraseña
3. Automáticamente obtienes **7 días gratis**

### 2. Configurar Servicios
1. Ve a la sección **Servicios**
2. Crea tus servicios con:
   - Nombre (ej: "Corte Clásico")
   - Descripción
   - Duración en minutos
   - Precio

### 3. Configurar Horarios
1. Ve a **Horarios**
2. Activa/desactiva días de la semana
3. Define horarios de apertura y cierre

### 4. Compartir Link Público
1. En el **Dashboard**, copia el link público
2. Compártelo por WhatsApp, redes sociales, etc.
3. Tus clientes pueden reservar directamente

### 5. Gestionar Turnos
- Ve a **Turnos** para ver todas las reservas
- Crea turnos manualmente si es necesario
- Cancela turnos desde el panel

## 📱 Link Público para Clientes

El link tiene el formato: `https://tu-dominio.com/book/{tu-user-id}`

Los clientes pueden:
1. Ver tus servicios con precios
2. Seleccionar fecha y hora
3. Completar sus datos
4. Confirmar la reserva
5. Recibir email de confirmación

## 🔐 Autenticación y Seguridad

- Sistema JWT para autenticación
- Contraseñas hasheadas con bcrypt
- Verificación automática de suscripción
- Validación de disponibilidad de horarios

## 💳 Suscripción

- **Prueba gratuita**: 7 días automáticos
- **Plan Mensual**: $999/mes
- Sistema preparado para MercadoPago
- Contador de días restantes en dashboard

## 🛠️ Tecnologías

- **Backend**: FastAPI + Python
- **Frontend**: React + Shadcn/UI
- **Base de Datos**: MongoDB
- **Autenticación**: JWT
- **Email**: Resend API
- **Pagos**: MercadoPago (preparado)

## 📊 Estructura de la Base de Datos

### Users
- user_id, email, password_hash, business_name
- trial_ends, subscription_active, subscription_ends

### Services
- service_id, user_id, name, description
- duration_minutes, price, active

### Business Hours
- user_id, day_of_week (0-6)
- is_open, open_time, close_time

### Appointments
- appointment_id, user_id, service_id
- client_name, client_phone, client_email
- date, time, status (pending/confirmed/cancelled)

## 🌐 URLs del Sistema

- `/login` - Inicio de sesión
- `/register` - Registro
- `/dashboard` - Panel principal
- `/services` - Gestión de servicios
- `/business-hours` - Configuración de horarios
- `/appointments` - Gestión de turnos
- `/subscription` - Estado de suscripción
- `/book/{user_id}` - Página pública de reservas

## 📧 Configuración de Emails

Para activar notificaciones por email:

1. Registrarse en [Resend](https://resend.com)
2. Obtener API key
3. Agregar en `/app/backend/.env`:
   ```
   RESEND_API_KEY=tu_api_key
   ```
4. Reiniciar backend: `sudo supervisorctl restart backend`

## 💡 Próximas Mejoras Sugeridas

- **Integración completa con MercadoPago** para pagos recurrentes
- **Recordatorios automáticos** vía email 24hs antes del turno
- **Panel de reportes** con métricas avanzadas
- **Integración WhatsApp** para confirmaciones
- **Sistema de calificaciones** de clientes
- **Múltiples sucursales** para cadenas de negocios

## 🎯 Caso de Uso Típico

**Barbería "El Corte"**:
1. Se registra en Turnitos
2. Crea servicios: "Corte ($5000)", "Barba ($3000)", "Combo ($7000)"
3. Configura horarios: Lun-Vie 9:00-18:00, Sáb 9:00-14:00
4. Comparte link por Instagram y WhatsApp
5. Clientes reservan online 24/7
6. Dueño ve turnos en tiempo real desde el celular
7. Sistema envía confirmaciones automáticas

---

**Desarrollado con tema "Abeja" 🐝 - Profesional, eficiente y productivo**
