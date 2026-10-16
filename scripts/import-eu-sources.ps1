# One-time controlled import. Build/test never download changing rule sources.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceFile = Join-Path $projectRoot '.artifacts/official/eu-validation-criteria-v8.2.xlsx'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$workbookZip = [IO.Compression.ZipFile]::OpenRead($sourceFile)
function Read-SourceEntry($entryName) {
  $reader = [IO.StreamReader]::new($workbookZip.GetEntry($entryName).Open())
  try { $reader.ReadToEnd() } finally { $reader.Dispose() }
}
try {
  [xml]$shared = Read-SourceEntry 'xl/sharedStrings.xml'
  $strings = @($shared.sst.si | ForEach-Object { $_.InnerText })
  [xml]$sheet = Read-SourceEntry 'xl/worksheets/sheet2.xml'
  $rules = @()
  foreach ($row in $sheet.worksheet.sheetData.row) {
    $values = @{}
    $types = @{}
    foreach ($cell in $row.c) {
      $column = $cell.r -replace '\d', ''
      $types[$column] = $cell.t
      $values[$column] = if ($cell.t -eq 's') { $strings[[int]$cell.v] } else { [string]$cell.v }
    }
    if ($values['A'] -notmatch '^\d+\.(?:\d+|BP[\d.]+)$') { continue }
    # Identifiers stored as text must retain trailing zeroes: 11.10 != 11.1.
    $identifier = $values['A']
    if ($types['A'] -ne 's' -and $identifier -match '^\d+\.\d+$') {
      $identifier = ([double]::Parse($identifier, [cultureinfo]::InvariantCulture)).ToString('0.###', [cultureinfo]::InvariantCulture)
    }
    $rules += [ordered]@{ id = $identifier; category = $values['B']; type = $values['D']; historyRequired = ($values['E'] -match 'Y'); sourceRow = [int]$row.r }
  }
} finally { $workbookZip.Dispose() }
if (($rules.id | Select-Object -Unique).Count -ne $rules.Count) { throw 'Duplicate rule identifier in import' }
if ($rules.Count -ne 111 -or $rules.id -notcontains '11.10' -or $rules.id -notcontains '15.10') { throw 'Unexpected rule catalogue' }
$catalogue = [ordered]@{
  authority = 'EU'; ectd = '3.2.2'; module1 = '3.1.1'; criteria = '8.2'; reviewedAt = '2026-10-16'
  sourceUrl = 'https://esubmission.ema.europa.eu/eumodule1/eCTD%203.2.2%20-%20EU%20M1%20Validation%20Criteria%20v8.2.xlsx'
  sourceSha256 = (Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash.ToLowerInvariant()
  sheet = 'eCTD Validation Criteria'; rules = $rules
}
$outputDirectory = Join-Path $projectRoot 'validation'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$encoding = [Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText((Join-Path $outputDirectory 'eu-v8.2-catalogue.json'), ($catalogue | ConvertTo-Json -Depth 6) + "`n", $encoding)
Write-Output "Imported $($rules.Count) distinct official rule IDs."
