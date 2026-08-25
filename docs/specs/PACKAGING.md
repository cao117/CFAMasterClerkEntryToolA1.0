# Packaging
 
1. Ensure Rust and Tauri CLI are installed
2. Run `npm run tauri build`
3. Find binaries in `src-tauri/target/release/` or `dist/`
4. Distribute `.exe`, `.app`, or Linux binaries as needed

## Desktop release metadata & Windows trust (MCE-8, 2026-08-25)

- `src-tauri/tauri.conf.json` `bundle.publisher` / `copyright` / `shortDescription` / `longDescription` populate the Windows PE `VERSIONINFO` (CompanyName, LegalCopyright, FileDescription). v0.5.0 shipped with no CompanyName and a garbage LegalCopyright, which is one of the signals Windows Defender's ML heuristic (`Trojan:Win32/Bearfoos.A!ml`) weighs against unsigned binaries.
- `src-tauri/Cargo.toml` `[profile.release]` is `debug = false, strip = true` — release builds must not ship debug symbols.
- Builds are still **unsigned**. SmartScreen "unrecognized app" and the Defender `!ml` false positive are only fully removed by code signing (Azure Artifact Signing ~USD 10/mo, SignPath Foundation free-for-OSS) or Microsoft Store MSIX distribution (Microsoft re-signs). Until then, submit each release's `.exe`/`.msi` SHA-256 at https://www.microsoft.com/en-us/wdsi/filesubmission as "Software developer — false positive".
- Root `LICENSE` (MIT) is required for free OSS signing programs (SignPath) — keep it in place.
