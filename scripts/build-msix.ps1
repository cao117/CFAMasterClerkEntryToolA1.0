<#
.SYNOPSIS
  Package the Windows release build as an MSIX for Microsoft Store submission.

.DESCRIPTION
  Tauri only emits .exe/.msi installers, so this script stages the release binary
  plus the Store logos next to src-tauri/msix/AppxManifest.xml and runs makeappx.
  The Store re-signs packages after certification, so the upload package is unsigned.

  Run from anywhere on Windows with the Windows 10/11 SDK installed (makeappx.exe):
    powershell -File scripts\build-msix.ps1 -Build            # build + pack
    powershell -File scripts\build-msix.ps1 -Build -DevSign   # also emit a self-signed copy for local testing

  Output (default .\dist-msix):
    CFAMasterClerkEntryProgram_<ver>_x64.msix            unsigned  -> upload to Partner Center
    CFAMasterClerkEntryProgram_<ver>_x64-devsigned.msix  self-signed, test-only (-DevSign)
    devsign.cer                                          trust in Local Machine\Root before installing the test copy

.PARAMETER Build
  Run `npm run tauri -- build --no-bundle` first (release exe only, no NSIS/MSI).
.PARAMETER Version
  MSIX version "a.b.c.0". Defaults to the tauri.conf.json version + ".0".
  The Store rejects a leading 0 (0.x.y), so 0.x app versions must pass -Version or bump the app.
.PARAMETER OutDir
  Output folder, recreated on every run.
.PARAMETER DevSign
  Also sign a copy with a throwaway self-signed certificate whose subject equals the manifest Publisher.
#>
param(
  [switch]$Build,
  [string]$Version,
  [string]$OutDir = "dist-msix",
  [switch]$DevSign
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

# Must equal Identity/Publisher in AppxManifest.xml (assigned by Partner Center).
$publisher = "CN=BA9C661F-E938-4631-B3F8-36A01C6A77C2"
$exeName   = "CFAMasterClerkEntry.exe"   # Executable attribute in the manifest
$logos     = "StoreLogo", "Square44x44Logo", "Square150x150Logo"   # the only logos the manifest references

function Find-SdkTool([string]$name) {
  $kits = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
  $tool = Get-ChildItem $kits -Recurse -Filter $name -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*\x64\*" } |
    Sort-Object FullName -Descending | Select-Object -First 1
  if (-not $tool) { throw "$name not found under $kits - install the Windows 10/11 SDK" }
  $tool.FullName
}

if ($Build) {
  & npm run tauri -- build --no-bundle
  if ($LASTEXITCODE) { throw "tauri build failed ($LASTEXITCODE)" }
}

# --- Version: Store requires a.b.c.0 with a >= 1 ---
if (-not $Version) {
  $appVer = (Get-Content src-tauri/tauri.conf.json -Raw | ConvertFrom-Json).version
  if ($appVer -notmatch '^(\d+)\.(\d+)\.(\d+)$') { throw "Unexpected version '$appVer' in tauri.conf.json" }
  if ([int]$Matches[1] -lt 1) {
    throw "Store package versions must start at 1 (app version is $appVer). Bump the app to >= 1.0.0 or pass -Version a.b.c.0."
  }
  $Version = "$appVer.0"
}
if ($Version -notmatch '^[1-9]\d*\.\d+\.\d+\.0$') { throw "MSIX version must be a.b.c.0 with a >= 1 (got '$Version')" }

# --- Locate the release exe (Tauri names it after productName, spaces included) ---
$exes = @(Get-ChildItem src-tauri/target/release -Filter *.exe -File -ErrorAction SilentlyContinue)
if ($exes.Count -ne 1) { throw "Expected exactly one .exe in src-tauri/target/release, found $($exes.Count). Run with -Build." }

# --- Stage ---
$stage = Join-Path $OutDir "stage"
if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $stage "Assets") -Force | Out-Null

Copy-Item $exes[0].FullName (Join-Path $stage $exeName)
Get-ChildItem src-tauri/target/release -Filter *.dll -File | Copy-Item -Destination $stage
foreach ($logo in $logos) { Copy-Item "src-tauri/icons/$logo.png" (Join-Path $stage "Assets\$logo.png") }

$manifest = Get-Content src-tauri/msix/AppxManifest.xml -Raw
if ($manifest -notmatch [regex]::Escape("Publisher=`"$publisher`"")) { throw "AppxManifest.xml Publisher does not match `$publisher in this script" }
$manifest.Replace("__VERSION__", $Version) | Set-Content (Join-Path $stage "AppxManifest.xml") -Encoding UTF8 -NoNewline

# --- Pack (makeappx validates the manifest against the schema) ---
$makeappx = Find-SdkTool "makeappx.exe"
$pkgName  = "CFAMasterClerkEntryProgram_${Version}_x64"
$msix     = Join-Path $OutDir "$pkgName.msix"
& $makeappx pack /d $stage /p $msix /o
if ($LASTEXITCODE) { throw "makeappx failed ($LASTEXITCODE)" }
Write-Host "Store upload package (unsigned): $msix"

# --- Optional self-signed copy for local install testing ---
if ($DevSign) {
  $signtool = Find-SdkTool "signtool.exe"
  $cert = New-SelfSignedCertificate -Type Custom -Subject $publisher -KeyUsage DigitalSignature `
    -FriendlyName "CFA Master Clerk dev-sign (test only)" -CertStoreLocation "Cert:\CurrentUser\My" `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}") -NotAfter (Get-Date).AddMonths(3)
  $pfx = Join-Path $OutDir "devsign.pfx"
  $cer = Join-Path $OutDir "devsign.cer"
  $pw  = ConvertTo-SecureString "devsign" -AsPlainText -Force   # throwaway test cert, not a secret
  Export-PfxCertificate -Cert $cert -FilePath $pfx -Password $pw | Out-Null
  Export-Certificate -Cert $cert -FilePath $cer | Out-Null

  $signed = Join-Path $OutDir "$pkgName-devsigned.msix"
  Copy-Item $msix $signed
  & $signtool sign /fd SHA256 /f $pfx /p devsign $signed
  if ($LASTEXITCODE) { throw "signtool failed ($LASTEXITCODE)" }
  Remove-Item $pfx
  Write-Host "Test package (self-signed): $signed"
  Write-Host "Trust $cer in Local Machine\Root (or Trusted People) before installing it."
}
