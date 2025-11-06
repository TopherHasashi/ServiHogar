# Script para probar la integración de Mercado Pago en ServiHogar
# Ejecutar desde la raíz del proyecto Proyecto/

Write-Host "🔧 Instalando dependencias del backend..." -ForegroundColor Cyan
pip install mercadopago==2.2.3

Write-Host ""
Write-Host "✅ Dependencia instalada" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Pasos siguientes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copia tus credenciales de Mercado Pago:"
Write-Host "   - Ve a: https://www.mercadopago.cl/developers/panel/app"
Write-Host "   - Copia tu 'Access Token de Prueba'"
Write-Host ""
Write-Host "2. Configura tu archivo .env:"
Write-Host "   MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-XXXXXX-XXXXXXXXXXXXXXXXXXXXXX"
Write-Host "   FRONTEND_URL=http://localhost:5173"
Write-Host ""
Write-Host "3. Reinicia el servidor Django:"
Write-Host "   docker-compose restart web"
Write-Host "   # O si estás en desarrollo local:"
Write-Host "   python manage.py runserver"
Write-Host ""
Write-Host "4. Prueba el flujo completo:"
Write-Host "   - Registra un usuario cliente"
Write-Host "   - Registra un profesional (o usa admin para aprobar rápido)"
Write-Host "   - Como cliente, haz una reserva"
Write-Host "   - Como profesional, confirma la reserva"
Write-Host "   - Como cliente, ve a 'Mis Solicitudes' y haz clic en 'Pagar'"
Write-Host "   - Usa una tarjeta de prueba:"
Write-Host "     * Número: 5416 7526 0258 2580"
Write-Host "     * CVV: 123"
Write-Host "     * Vencimiento: 11/25"
Write-Host "     * Nombre: APRO"
Write-Host ""
Write-Host "5. Para probar webhooks en local, usa ngrok:"
Write-Host "   ngrok http 8000"
Write-Host "   Luego configura la URL de webhook en Mercado Pago"
Write-Host ""
Write-Host "📖 Lee MERCADOPAGO_README.md para más detalles" -ForegroundColor Cyan
Write-Host ""
