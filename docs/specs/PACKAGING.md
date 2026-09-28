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

## Microsoft Store (MSIX) — 2026-09-28

- CFA owns the Partner Center company account (set up by James Simbro). Product: **CFA Master Clerk Entry Program**, Store ID `9PL3VSD62SQG`, https://apps.microsoft.com/detail/9PL3VSD62SQG.
- Package identity (Partner Center → Product management → Product identity) lives in `src-tauri/msix/AppxManifest.xml`. The manifest `DisplayName` must be a name reserved under *Manage app names*.
- Build: `powershell -File scripts\build-msix.ps1 -Build` on Windows with the Windows SDK, or run the **Build MSIX (Microsoft Store)** workflow → artifact `msix-store-upload`. Upload the unsigned `.msix` in Partner Center; the Store signs it after certification (up to 3 business days). `-DevSign` produces a self-signed copy + `.cer` for local install testing only.
- Version rule: the package version is `a.b.c.0` and `a` must be ≥ 1, so the app version needs to be ≥ 1.0.0 (or pass `-Version`). Every submission must carry a higher version than the previous one.
- Not covered by the package: the WebView2 runtime (present on Windows 11 and on updated Windows 10; Tauri prompts to install it if missing). Under MSIX, `%APPDATA%` writes (auto-saves) are virtualized to `%LOCALAPPDATA%\Packages\<PFN>\LocalCache` and are removed on uninstall; files exported to a chosen folder are unaffected.
- The GitHub `.exe`/`.msi` releases continue unchanged for anyone not installing from the Store.
