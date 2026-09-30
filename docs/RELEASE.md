# Release Procedure

One release is one version number, shipped to every channel in a fixed order. Follow every step for every release, including urgent fixes.

## Channels

| # | Channel | What ships | Trigger | Automatic? |
|---|---------|------------|---------|------------|
| 1 | Dev web | https://mce-dev.cfa.services | push to `dev` | Yes |
| 2 | Production web | https://mce.cfa.services | push to `master` | Yes |
| 3 | Desktop installers | Mac `.dmg`, Windows `.msi` and `.exe` on the GitHub Release | push tag `vX.Y.Z` | Yes |
| 4 | Microsoft Store | Windows `.msix` for *CFA Master Clerk Entry Program* | same tag builds the package; upload in Partner Center | Build yes, upload no |

The Store version always trails the others: Microsoft certifies each upload, which takes up to 3 business days.

## Rules

- **The commit checked on dev is the commit that goes to production.** Set the version before checking dev, so nothing changes between the check and the promotion.
- **Tests gate every channel.** Every workflow runs `npm test` before it deploys or builds. A failing test stops the release.
- **The tag must equal the version in the files.** The tag workflows check this and stop if `vX.Y.Z` does not match.
- **Never move or reuse a tag.** If a release is wrong, fix it and ship the next patch version.
- **Version numbers** are `X.Y.Z`:
  - `Z` (patch): bug fix, no new behavior for the clerk to learn
  - `Y` (minor): new feature, or a season update such as new breeds
  - `X` (major): saved files from older versions can no longer be opened
  - The Microsoft Store needs `X` to be 1 or higher, and each upload must be higher than the last.

## Steps

### 1. Land the work on `dev`
Work happens on a `fix/*` or `feature/*` branch made from `dev`.

```bash
npm test                      # all tests pass locally
git checkout dev && git pull
git merge --no-ff fix/my-change
```

### 2. Set the version
```bash
npm run release:version -- X.Y.Z     # updates all five version files
git commit -am "chore: release vX.Y.Z"
git push origin dev
```
The script refuses a version that is not higher than the current one, a tag that already exists, or version files that disagree with each other. `npm run release:check` prints the current version.

### 3. Check dev
- The **Deploy to Dev Server** workflow is green: `gh run watch`
- https://mce-dev.cfa.services shows `Version X.Y.Z` in the footer (reload the page)
- The change itself works on the dev site

### 4. Promote to production
```bash
git checkout master && git pull
git merge --no-ff dev -m "Merge dev → master: vX.Y.Z"
git push origin master
```
- The **Deploy to Server** workflow is green
- https://mce.cfa.services shows `Version X.Y.Z` in the footer

### 5. Tag the release
```bash
git tag vX.Y.Z                # on the master merge commit from step 4
git push origin vX.Y.Z
```
The tag starts two workflows:
- **Build Desktop App** publishes the Mac and Windows installers to the GitHub Release `vX.Y.Z`
- **Build MSIX (Microsoft Store)** builds the Store package, installs and launches it on the runner, and runs the Windows App Certification Kit

Both must be green.

### 6. Upload to the Microsoft Store
```bash
gh run list --workflow "Build MSIX (Microsoft Store)" --limit 1     # find the run id
gh run download <run-id> -n msix-store-upload
```
In Partner Center, open *CFA Master Clerk Entry Program*, start an update submission, replace the package with the downloaded `.msix`, and submit. This step needs a Partner Center login and is done by a person.

### 7. Bring `dev` level with `master`
```bash
git checkout dev && git merge --ff-only master && git push origin dev
```

### 8. Record and notify
- Add a row to the release log at the bottom of this file, committed on `dev` (it reaches `master` with the next release)
- Confirm each change in the release has its entry in `docs/meta/BUGFIX-CHANGELOG.md` or the matching changelog
- Send CFA the GitHub Release link, and the Store link once certification passes
- Until the installers are code-signed, submit the `.exe` and `.msi` hashes to Microsoft as described in `docs/specs/PACKAGING.md`

## Rolling back

| Channel | How |
|---------|-----|
| Dev web | `git revert <commit>` on `dev`, push |
| Production web | `git revert -m 1 <merge commit from step 4>` on `master`, push. The site redeploys the previous state in about a minute. |
| Desktop installers | The previous GitHub Release stays available. Mark the bad one: `gh release edit vX.Y.Z --prerelease`. Ship the fix as the next patch version. |
| Microsoft Store | There is no rollback. Ship the fix as the next patch version and submit it. |

## Known limits

- The Mac and Windows installers on GitHub are unsigned, so macOS asks for "Open Anyway" and Windows may show SmartScreen. The Store package is signed by Microsoft.
- A tag cannot be rebuilt with different code. Fix forward with the next patch version.

## Release log

| Version | Date | Contents | Channels |
|---------|------|----------|----------|
| 1.0.1 | 2026-09-30 | Household Pet top-15 cutoff corrected from 50 to 30 (MCE-9). First release made with this procedure. | Web, desktop installers; Store submitted 2026-09-30 (certification pending) |
| 1.0.0 | 2026-09-28 | First Microsoft Store release (same features as 0.5.0) | Store only |
| 0.5.0 | 2026-08-15 | 2026-27 season breed update | Web, desktop installers |
