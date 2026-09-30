# Microsoft Store listing — CFA Master Clerk Entry Program

Copy-paste source for the Partner Center submission (Store ID `9PL3VSD62SQG`,
https://partner.microsoft.com/dashboard/products/9PL3VSD62SQG/overview).
Field names follow Microsoft's submission checklist (learn.microsoft.com, updated 2026-08-24).
Assets in this folder: `screenshot-1-general.png`, `screenshot-2-championship.png` (1920×1080),
`store-logo-300x300.png`.

## Pricing and availability

| Field | Value |
|---|---|
| Markets | All possible markets (default) |
| Audience | Public audience |
| Discoverability | **Make this product available but not discoverable in the Store** → **Direct link only**. Clerks receive the link from CFA; the listing is not surfaced by Store search. (Choose the default "available and discoverable" instead if CFA wants clerks to find it by searching the Store.) |
| Schedule | Release: as soon as possible · Stop acquisition: never |
| Base price | Free |
| Free trial / Sale pricing / Organizational licensing | leave defaults |

## Properties

| Field | Value |
|---|---|
| Category | Business |
| Subcategory / Secondary category | none |
| Privacy policy URL | not required — the app does not access, collect or transmit personal information; all data stays on the clerk's computer |
| Website | https://mce.cfa.services |
| Support contact info | CFA's public support contact from the Partner Center account |
| Display mode / Game settings / Product declarations | leave defaults |
| System requirements | Minimum: Windows 10 version 1809, x64 · Screen at least 1280 px wide · Microsoft Edge WebView2 Runtime |

## Age ratings (IARC questionnaire)

Answer **No** to every content and interaction question (no violence, no user-generated content, no
chat, no location sharing, no purchases, no personal information collected). Expected result: suitable for all ages.

## Packages

Upload `CFAMasterClerkEntryProgram_<version>_x64.msix` from the `msix-store-upload` artifact of the
**Build MSIX (Microsoft Store)** workflow. Unsigned is correct — the Store signs it after certification.
Leave *Device family availability* at its default (Windows 10/11 desktop).

## Store listing (English)

**Description**

CFA Master Clerk Entry Program is the desktop tool CFA master clerks use to record a cat show's results.

Enter the show information and judges once. The program builds the finals sheets for every ring — Championship, Kitten, Premiership and Household Pet — plus breed sheets for each judge, checks every entry against CFA finals rules as you type, and exports the completed show as an Excel workbook in the official CFA layout. Work is auto-saved on your computer; nothing is sent over the network.

**App features** (one per line)

- Show setup: date, club, master clerk, judges, ring numbers and ring types (Allbreed, Longhair, Shorthair, OCP, Super Specialty)
- Finals entry per ring for Championship, Kitten, Premiership and Household Pet
- Breed sheet awards for every judge, using the current season's CFA breed and division list
- Real-time validation: duplicates, placement order, voids, hair-length and cross-ring rules
- Excel export and import of the complete show; auto-save with resume on next launch
- Zoom control for long clerking sessions

**What's new in this version**

First Microsoft Store release. Same features as the 2026-27 season desktop build, now installed and updated through the Store.

**Screenshots** — `screenshot-1-general.png` (show setup and judges), `screenshot-2-championship.png` (Championship finals grid).

**Store logos** — `store-logo-300x300.png` (1:1).

**Keywords** — CFA, cat show, master clerk, finals, clerking

**Copyright and trademark info** — Copyright (c) 2024-2026 Cat Fanciers' Association

## Submission options

**Notes for certification**

Data-entry tool for Cat Fanciers' Association show clerks. No sign-in, no network access, no personal data collected. Requires the Microsoft Edge WebView2 Runtime (included with Windows 11). To exercise the app: on the General tab click "Fill Test Data" to load a sample show, then open the Championship tab. The window needs at least 1280 px of width.

Restricted capabilities: none declared (only `runFullTrust`, which is standard for desktop apps).
