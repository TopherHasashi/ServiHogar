$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$mock = Join-Path $root 'Mockup Figma'
$docs = Join-Path $root 'docs'
$docsGuides = Join-Path $docs 'guidelines'
$docsDb = Join-Path $docs 'db'
$docsDesign = Join-Path $docs 'design'
$archive = Join-Path $mock '_archive'

function Ensure-Dir($path) { if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path | Out-Null } }

# Ensure target folders
Ensure-Dir $docs
Ensure-Dir $docsGuides
Ensure-Dir $docsDb
Ensure-Dir $docsDesign
Ensure-Dir $archive

# Move top-level docs to /docs
$topDocs = @(
  'diagrama_flujo_servihogar.txt',
  'historias_usuario_formato_excel.txt',
  'instrucciones_diseño_lucidchart_servihogar.txt',
  'matriz_raci_general_servihogar.txt',
  'matriz_raci_servihogar.txt'
)
foreach ($f in $topDocs) {
  $src = Join-Path $mock $f
  if (Test-Path $src) { Move-Item -Force $src -Destination $docs }
}

# Move guidelines
$guidelinesDir = Join-Path $mock 'guidelines'
if (Test-Path (Join-Path $guidelinesDir 'Guidelines.md')) {
  Move-Item -Force (Join-Path $guidelinesDir 'Guidelines.md') -Destination (Join-Path $docsGuides 'Guidelines.md')
}
# Move Attributions as guideline
$attrib = Join-Path $mock 'Attributions.md'
if (Test-Path $attrib) { Move-Item -Force $attrib -Destination (Join-Path $docsGuides 'Attributions.md') }

# Move database folder to docs/db (entire folder)
$dbDir = Join-Path $mock 'database'
if (Test-Path $dbDir) {
  # Move all content into docs/db
  Get-ChildItem -Path $dbDir -Force | ForEach-Object { Move-Item -Force $_.FullName -Destination $docsDb }
  # Remove empty folder
  Remove-Item -Force -Recurse $dbDir
}

# Components cleanup: archive what we won't use now
$compDir = Join-Path $mock 'components'
if (Test-Path $compDir) {
  # Archive heavy sections
  $toArchiveDirs = @('admin','client','professional','user')
  foreach ($d in $toArchiveDirs) {
    $src = Join-Path $compDir $d
    if (Test-Path $src) {
      $dst = Join-Path $archive (Join-Path 'components' $d)
      Ensure-Dir (Split-Path -Parent $dst)
      Move-Item -Force $src -Destination $dst
    }
  }

  # UI: keep only button.tsx and utils.ts, archive the rest
  $uiDir = Join-Path $compDir 'ui'
  if (Test-Path $uiDir) {
    Get-ChildItem -Path $uiDir -File | Where-Object { $_.Name -notin @('button.tsx','utils.ts') } | ForEach-Object {
      $dst = Join-Path $archive (Join-Path 'components\ui' $_.Name)
      Ensure-Dir (Split-Path -Parent $dst)
      Move-Item -Force $_.FullName -Destination $dst
    }
  }

  # figma: keep ImageWithFallback.tsx, archive others
  $figmaDir = Join-Path $compDir 'figma'
  if (Test-Path $figmaDir) {
    Get-ChildItem -Path $figmaDir -File | Where-Object { $_.Name -ne 'ImageWithFallback.tsx' } | ForEach-Object {
      $dst = Join-Path $archive (Join-Path 'components\figma' $_.Name)
      Ensure-Dir (Split-Path -Parent $dst)
      Move-Item -Force $_.FullName -Destination $dst
    }
  }
}

# Remove temp files
$tempFiles = @(
  'cleanup-temp-marker.txt',
  'temp_badges_completion.txt',
  'temp_cleanup.txt',
  'temp_cleanup_complete.md',
  'temp_search.js',
  'temp_service_booking_details.txt',
  'App.tsx'
)
foreach ($f in $tempFiles) {
  $p = Join-Path $mock $f
  if (Test-Path $p) { Remove-Item -Force $p }
}

# Move styles/globals.css to docs/design
$stylesDir = Join-Path $mock 'styles'
$globals = Join-Path $stylesDir 'globals.css'
if (Test-Path $globals) {
  Move-Item -Force $globals -Destination (Join-Path $docsDesign 'globals.css')
  # Remove styles dir if empty
  if (-not (Get-ChildItem -Path $stylesDir -Recurse -Force -ErrorAction SilentlyContinue)) {
    Remove-Item -Force -Recurse $stylesDir
  }
}

Write-Host 'Cleanup complete.' -ForegroundColor Green
