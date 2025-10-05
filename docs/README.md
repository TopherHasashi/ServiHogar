# Documentación del repositorio

Este directorio centraliza documentos de diseño, guías y base de datos extraídos del mockup de Figma para que el repositorio quede ordenado.

- `docs/` (este folder):
  - `diagrama_flujo_servihogar.txt`
  - `historias_usuario_formato_excel.txt`
  - `instrucciones_diseño_lucidchart_servihogar.txt`
  - `matriz_raci_general_servihogar.txt`
  - `matriz_raci_servihogar.txt`
- `docs/guidelines/`
  - `Guidelines.md`: lineamientos de diseño
  - `Attributions.md`: atribuciones
- `docs/db/`: archivos de base de datos (modelos, migraciones SQL, diagramas)
- `docs/design/`
  - `globals.css`: estilos del mockup (referencia). El frontend actual usa Tailwind v4 con un theme básico; cuando quieras migrar tokens o estilos más avanzados, partimos desde aquí.

Notas:
- En `Mockup Figma/_archive/` quedó material no utilizado aún (UI kit y pantallas avanzadas); está ignorado en Git.
- Cuando importes nuevos componentes del mockup, copia el archivo a `frontend/src/components/...`, ajusta imports y ejecuta `npm run build` para validar.
