<#
.SYNOPSIS
  Package the Farm Together 2 Vortex extension into the archive Nexus and Vortex expect.

.DESCRIPTION
  Runs from any directory (paths resolve from this script's folder). In order:
    1. requires node;
    2. runs the fast tests (tests/installers.test.js, tests/release.test.js);
    3. stages exactly index.js, installers.js, info.json, gameart.png and LICENSE (explicit list,
       never a glob) and validates the staged metadata and artwork (tools/release/validate.js);
    4. writes the zip to a temporary .partial file, re-opens it and checks the entry set, the bytes
       of every entry against its source, the version, and that index.js loads its local
       ./installers dependency with plain node (no Vortex needed);
    5. only then moves it to <OutDir>/FarmTogether2Vortex-<info.json version>.zip.
  A failure at any step leaves any existing archive untouched and no new one behind.
  The version comes from info.json and is never changed here.

  Progress goes to stderr and to a log under .tmp/pack/; the run ends with one
  "OK (exit 0) log: <path>" or "FAILED (exit N) log: <path>" line on stderr.
  Works in Windows PowerShell 5.1 and PowerShell 7.

.PARAMETER OutDir
  Directory for the archive. Default: dist/ beside this script. Created if missing.

.PARAMETER Json
  Print one JSON object on stdout and nothing else:
  { archive, version, sha256, entries }.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File <repo>\pack.ps1 -Json

.NOTES
  Exit codes: 0 OK; 1 prerequisite missing (node); 2 tests failed; 3 metadata or artwork invalid;
  4 archive verification failed.
#>
[CmdletBinding()]
param([string]$OutDir, [switch]$Json)
Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$logDir = Join-Path $root '.tmp/pack'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir ("pack-{0}-{1}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $PID)
$expected = @('index.js', 'installers.js', 'info.json', 'gameart.png', 'LICENSE')
$sources = [ordered]@{
  'index.js'      = 'src/index.js'
  'installers.js' = 'src/installers.js'
  'info.json'     = 'info.json'
  'gameart.png'   = 'assets/gameart.png'
  'LICENSE'       = 'LICENSE'
}
$script:temps = @()

function Say([string]$Message) {
  $line = '{0} {1}' -f (Get-Date -Format 'HH:mm:ss'), $Message
  [Console]::Error.WriteLine($line)
  Add-Content -LiteralPath $logFile -Value $line -Encoding UTF8
}

function Finish([int]$Code, [string]$Reason) {
  foreach ($t in $script:temps) { if (Test-Path -LiteralPath $t) { Remove-Item -LiteralPath $t -Recurse -Force } }
  if ($Reason) { Say "STOPPED: $Reason" }
  $final = if ($Code -eq 0) { "OK (exit 0) log: $logFile" } else { "FAILED (exit $Code) log: $logFile" }
  Add-Content -LiteralPath $logFile -Value $final -Encoding UTF8
  [Console]::Error.WriteLine($final)
  exit $Code
}

# Runs node with its output sent to the log (never stdout); returns the exit code.
function Invoke-Node([string[]]$Arguments) {
  Say ('> node {0}' -f ($Arguments -join ' '))
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'   # 5.1 turns redirected native stderr into errors under 'Stop'
  try {
    & $script:node @Arguments 2>&1 | ForEach-Object { Say ([string]$_) }
    return [int]$LASTEXITCODE
  } finally { $ErrorActionPreference = $prev }
}

function New-TempDir([string]$Prefix) {
  $dir = Join-Path ([IO.Path]::GetTempPath()) ("$Prefix-" + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $dir | Out-Null
  $script:temps += $dir
  return $dir
}

function Get-Sha256([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }

try {
  # 1. Prerequisites
  $cmd = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $cmd) { Finish 1 'node not found on PATH (needed for tests and validation)' }
  $script:node = $cmd.Source
  foreach ($rel in $sources.Values) {
    if (-not (Test-Path -LiteralPath (Join-Path $root $rel) -PathType Leaf)) { Finish 3 "missing $rel" }
  }

  # 2. Fast tests
  foreach ($t in @('tests/installers.test.js', 'tests/release.test.js')) {
    if ((Invoke-Node @((Join-Path $root $t))) -ne 0) { Finish 2 "$t failed" }
  }

  # 3. Stage the explicit file list, then validate what was staged
  $stage = New-TempDir 'ft2vx-stage'
  foreach ($name in $sources.Keys) { Copy-Item -LiteralPath (Join-Path $root $sources[$name]) -Destination (Join-Path $stage $name) }
  if ((Invoke-Node @((Join-Path $root 'tools/release/validate.js'), '--stage', $stage)) -ne 0) { Finish 3 'staged metadata or artwork is invalid' }
  $version = (Get-Content -LiteralPath (Join-Path $stage 'info.json') -Raw | ConvertFrom-Json).version

  # 4. Build to a .partial file and verify it
  if ($OutDir) { $OutDir = $PSCmdlet.GetUnresolvedProviderPathFromPSPath($OutDir) } else { $OutDir = Join-Path $root 'dist' }
  New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
  $archive = Join-Path $OutDir "FarmTogether2Vortex-$version.zip"
  $partial = Join-Path $OutDir (".FarmTogether2Vortex-$version.zip.{0}.partial" -f $PID)
  $script:temps += $partial
  Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
  $zip = [IO.Compression.ZipFile]::Open($partial, [IO.Compression.ZipArchiveMode]::Create)
  try {
    foreach ($name in $expected) {
      [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $stage $name), $name, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
  } finally { $zip.Dispose() }

  $check = New-TempDir 'ft2vx-check'
  $read = [IO.Compression.ZipFile]::OpenRead($partial)
  try { $entries = @($read.Entries | ForEach-Object { $_.FullName }) } finally { $read.Dispose() }
  $want = ($expected | Sort-Object) -join '|'
  $got = ($entries | Sort-Object) -join '|'
  if ($got -ne $want) { Finish 4 "archive entries are [$got], expected [$want]" }
  [IO.Compression.ZipFile]::ExtractToDirectory($partial, $check)
  foreach ($name in $sources.Keys) {
    if ((Get-Sha256 (Join-Path $check $name)) -ne (Get-Sha256 (Join-Path $root $sources[$name]))) { Finish 4 "$name in the archive differs from $($sources[$name])" }
  }
  $packedVersion = (Get-Content -LiteralPath (Join-Path $check 'info.json') -Raw | ConvertFrom-Json).version
  if ($packedVersion -ne $version) { Finish 4 "archive info.json version $packedVersion != $version" }
  $probe = "const m = require(process.argv[1]); if (typeof m.default !== 'function') { console.error('index.js exports no default function'); process.exit(1); }"
  if ((Invoke-Node @('-e', $probe, (Join-Path $check 'index.js'))) -ne 0) { Finish 4 'packed index.js does not load with plain node' }

  # 5. Publish the verified archive
  Move-Item -LiteralPath $partial -Destination $archive -Force
  $sha = Get-Sha256 $archive
  Say "Created $archive ($((Get-Item -LiteralPath $archive).Length) bytes) version $version sha256 $sha"
  if ($Json) {
    [pscustomobject]@{ archive = $archive; version = $version; sha256 = $sha; entries = $expected } | ConvertTo-Json -Compress
  } else {
    Write-Output "Created $archive"
    Write-Output "Version $version, SHA-256 $sha"
  }
  Finish 0
} catch {
  Finish 4 $_.Exception.Message
}
