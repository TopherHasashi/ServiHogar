# Auto-Completado Automático de Servicios

## Descripción

Este sistema auto-completa servicios confirmados después de 3 días de su fecha programada. Esto asegura que los profesionales reciban su pago incluso si el cliente olvida marcar el servicio como completado.

## Ejecución Manual

Para ejecutar el comando manualmente:

```bash
# Modo dry-run (sin hacer cambios, solo muestra qué se haría)
docker exec servihogar-web python manage.py auto_complete_services --dry-run

# Ejecución real
docker exec servihogar-web python manage.py auto_complete_services
```

## Configuración de Cron Job (Automatización)

### En el servidor (Linux)

Edita el crontab:
```bash
crontab -e
```

Agrega esta línea para ejecutar diariamente a las 2 AM:
```
0 2 * * * cd /ruta/a/tu/proyecto && docker exec servihogar-web python manage.py auto_complete_services >> /var/log/servihogar_autocompletar.log 2>&1
```

### En Windows (Programador de Tareas)

1. Abre el "Programador de tareas"
2. Crea una nueva tarea básica
3. Configura para que se ejecute diariamente
4. Acción: Iniciar un programa
5. Programa: `docker`
6. Argumentos: `exec servihogar-web python manage.py auto_complete_services`
7. Directorio inicial: `T:\Github\ServiHogar\Fase 2\Evidencias Proyecto\Proyecto`

### En Docker Compose (recomendado para producción)

Agrega un servicio de scheduler en `docker-compose.yml`:

```yaml
services:
  # ... otros servicios ...
  
  scheduler:
    build: .
    command: >
      sh -c "while true; do
        python manage.py auto_complete_services;
        sleep 86400;
      done"
    depends_on:
      - db
      - web
    environment:
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

## Lógica del Auto-Completado

1. El sistema busca servicios en estado `confirmado`
2. Verifica que la fecha programada sea hace más de 3 días
3. Cambia el estado a `completado` y registra `completado_en`
4. Esto libera el pago al profesional automáticamente

## Logs

Los logs del comando se guardan en el log estándar de Django. Para verlos:

```bash
docker logs servihogar-web --tail 100 | grep "Auto-completado"
```
