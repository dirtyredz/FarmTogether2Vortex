<#
.SYNOPSIS
  Contract tests for pack.ps1: archive layout, byte equality, plain-node load, and failure safety.

.DESCRIPTION
  Runs pack.ps1 from a foreign working directory into an output folder whose path has spaces, then
  checks the JSON result, the exact entry set, every entry's bytes, the version, and that the
  extracted index.js resolves ./installers with plain node. Then packs fixture copies of the repo
  (in temp folders with spaces) with missing artwork, malformed metadata and wrong-size artwork, and
  asserts each fails non-zero, leaves a pre-existing archive byte-identical and leaves no .partial.
  Uses temp folders only; the repo's dist/ is not touched.

  Run: powershell -NoProfile -ExecutionPolicy Bypass -File tests/package.test.ps1   (or pwsh)
  Exit codes: 0 all passed; 1 a check failed (the failing check is printed).
#>
Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$shell = (Get-Process -Id $PID).Path
$temps = @()
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

function Assert([bool]$Condition, [string]$What) { if (-not $Condition) { throw "FAIL: $What" } }
function New-Temp([string]$Name) {
  $d = Join-Path ([IO.Path]::GetTempPath()) ("ft2vx $Name " + [guid]::NewGuid().ToString('N').Substring(0, 8))
  New-Item -ItemType Directory -Path $d | Out-Null
  $script:temps += $d
  $d
}
function Get-Sha([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }

# Runs pack.ps1 in a child shell from %TEMP%; returns @{ Code; Out }. stderr goes to the console.
function Invoke-Pack([string]$PackScript, [string]$OutDir) {
  Push-Location -LiteralPath ([IO.Path]::GetTempPath())
  try {
    $out = & $shell -NoProfile -ExecutionPolicy Bypass -File $PackScript -OutDir $OutDir -Json
    @{ Code = $LASTEXITCODE; Out = ($out -join "`n") }
  } finally { Pop-Location }
}

# A copy of the files pack.ps1 needs, so failure cases never touch the real repo.
function New-Fixture([string]$Name) {
  $f = New-Temp "fixture $Name"
  foreach ($rel in @('pack.ps1', 'info.json', 'LICENSE', 'NEXUS.md', 'nexus-paste.md', 'src', 'tests', 'tools', 'assets')) {
    Copy-Item -LiteralPath (Join-Path $root $rel) -Destination (Join-Path $f $rel) -Recurse
  }
  $f
}

try {
  # --- Happy path: real repo, foreign cwd, output path with spaces ---
  $out = New-Temp 'out dir'
  $r = Invoke-Pack (Join-Path $root 'pack.ps1') $out
  Assert ($r.Code -eq 0) "pack.ps1 exit 0 (got $($r.Code))"
  $res = $r.Out | ConvertFrom-Json
  $info = Get-Content -LiteralPath (Join-Path $root 'info.json') -Raw | ConvertFrom-Json
  Assert ($res.version -eq $info.version) 'JSON version equals info.json version'
  Assert ($res.archive -eq (Join-Path $out "FarmTogether2Vortex-$($info.version).zip")) "archive path is version-named in OutDir ($($res.archive))"
  Assert (Test-Path -LiteralPath $res.archive) 'archive exists'
  Assert ($res.sha256 -eq (Get-Sha $res.archive)) 'JSON sha256 matches the file'
  Assert (@(Get-ChildItem -LiteralPath $out -Filter '*.partial').Count -eq 0) 'no .partial left behind'

  $z = [IO.Compression.ZipFile]::OpenRead($res.archive)
  try { $names = @($z.Entries | ForEach-Object { $_.FullName }) } finally { $z.Dispose() }
  $want = @('LICENSE', 'gameart.png', 'index.js', 'info.json', 'installers.js')
  Assert ((($names | Sort-Object) -join ',') -eq (($want | Sort-Object) -join ',')) "exact archive entries (got $($names -join ','))"
  Assert ((($res.entries | Sort-Object) -join ',') -eq (($want | Sort-Object) -join ',')) 'JSON entries match'

  $x = New-Temp 'extract'
  [IO.Compression.ZipFile]::ExtractToDirectory($res.archive, $x)
  $map = @{ 'index.js' = 'src/index.js'; 'installers.js' = 'src/installers.js'; 'info.json' = 'info.json'; 'gameart.png' = 'assets/gameart.png'; 'LICENSE' = 'LICENSE' }
  foreach ($k in $map.Keys) { Assert ((Get-Sha (Join-Path $x $k)) -eq (Get-Sha (Join-Path $root $map[$k]))) "$k bytes equal $($map[$k])" }
  $node = (Get-Command node -CommandType Application | Select-Object -First 1).Source
  # index.js requires ./installers at load time, so loading it from the extracted folder proves
  # the relative dependency resolves; vortex-api is only required inside main(), never here.
  & $node -e "const m=require(process.argv[1]); if (typeof m.default!=='function') process.exit(3);" (Join-Path $x 'index.js')
  Assert ($LASTEXITCODE -eq 0) 'extracted index.js loads ./installers with plain node'

  # --- Failure cases: nonzero, existing archive untouched, nothing partial ---
  $cases = @(
    @{ Name = 'missing art'; Break = { param($f) Remove-Item -LiteralPath (Join-Path $f 'assets/gameart.png') } },
    @{ Name = 'malformed info'; Break = { param($f) Set-Content -LiteralPath (Join-Path $f 'info.json') -Value '{ "name": "Farm Together 2", ' } },
    @{ Name = 'wrong gameId'; Break = { param($f) $p = Join-Path $f 'info.json'; (Get-Content -LiteralPath $p -Raw) -replace '7911', '1' | Set-Content -LiteralPath $p } },
    @{ Name = 'wrong art size'; Break = { param($f)
        Add-Type -AssemblyName System.Drawing
        $b = New-Object System.Drawing.Bitmap 320, 180
        try { $b.Save((Join-Path $f 'assets/gameart.png'), [System.Drawing.Imaging.ImageFormat]::Png) } finally { $b.Dispose() } } }
  )
  foreach ($case in $cases) {
    $f = New-Fixture $case.Name
    & $case.Break $f
    $o = New-Temp "out $($case.Name)"
    $existing = Join-Path $o "FarmTogether2Vortex-$($info.version).zip"
    Set-Content -LiteralPath $existing -Value 'previous good archive' -NoNewline
    $before = Get-Sha $existing
    $r = Invoke-Pack (Join-Path $f 'pack.ps1') $o
    Assert ($r.Code -ne 0) "$($case.Name): pack fails (exit $($r.Code))"
    Assert ([string]::IsNullOrWhiteSpace($r.Out)) "$($case.Name): no JSON result on failure"
    Assert ((Get-Sha $existing) -eq $before) "$($case.Name): existing archive untouched"
    Assert (@(Get-ChildItem -LiteralPath $o -Force | Where-Object { $_.Name -ne (Split-Path -Leaf $existing) }).Count -eq 0) "$($case.Name): nothing else written"
  }
  Write-Output 'package.test.ps1: OK'
  $code = 0
} catch {
  Write-Output $_.Exception.Message
  $code = 1
} finally {
  foreach ($t in $temps) { if (Test-Path -LiteralPath $t) { Remove-Item -LiteralPath $t -Recurse -Force } }
}
exit $code
