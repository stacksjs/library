# Notes for the Mac

The Mac app is a native AppKit app (Craft's host drawing the stx screens in
`resources/native`, no web view) and a client of the same HTTP API as the
website. It is declared in `config/desktop.ts`; the framework builds, signs and
packages it. It ships two ways from that one config.

| | Direct download | Mac App Store |
|---|---|---|
| Command | `bun run release:mac` | `bun run release:testflight` |
| Signed with | Developer ID Application, notarized | Apple Distribution, provisioning profile |
| Sandbox | no (it replaces its own bundle to update) | yes |
| Updates | in the app: Settings, Software Update | by the Store; the build has no updater |
| Sign-in token | login Keychain | data-protection Keychain, access group `3JJRNQW6B7.com.stacksjs.notes` |

| | |
|---|---|
| Name | Notes |
| Bundle id | `com.stacksjs.notes` |
| Team | `3JJRNQW6B7` (not a secret) |
| Category | `public.app-category.productivity` |
| Minimum macOS | 13.0 |
| Icon | `resources/native/icon/AppIcon-1024.png`, made by `swift scripts/make-app-icon.swift` |
| Server | `NOTES_API_URL` at build time, else production for `APP_ENV=production`, else `http://127.0.0.1:3408` |
| Version | `package.json`'s, bumped by `./buddy release` |

## Direct download and in-app updates

```bash
bun run release:mac:dry-run   # build, sign, zip, image and sign the manifest; nothing notarized or uploaded
bun run release:mac           # the same, notarized, stapled and published to the update feed
```

`buddy release:desktop` builds the Developer ID app, notarizes and staples it,
and publishes three things under `desktop-updates/stable/darwin-<arch>/` on the
app's storage disk: `latest.json` (the update manifest, signed with Ed25519),
`Notes-<version>-<arch>.zip` (what an installed app updates from) and
`Notes-<version>-<arch>.dmg` (what a person downloads). The server answers
`GET /api/updates/darwin/<arch>` from that disk.

The app asks that feed when it opens and once a day. An update is taken only if
its manifest verifies against the public key in `config/desktop.ts`, its archive
has the size and SHA-256 the manifest names, and the new bundle is validly signed
by the same team with the same identifier. It then replaces its own bundle and
offers a restart. The private key is `DESKTOP_UPDATE_PRIVATE_KEY`, encrypted in
`.env.production`; losing it means installed copies can never be updated.

What a release needs, all read from the environment (`APP_ENV=production` loads
`.env.production`, which needs `DOTENV_PRIVATE_KEY_PRODUCTION`):

| Needed | Variable | Status |
|---|---|---|
| Developer ID Application certificate | found in the login keychain, or `DESKTOP_SIGNING_IDENTITY` | `Developer ID Application: Chris Breuer (3JJRNQW6B7)` is installed |
| Notarization | `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_API_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY` | in `.env.production` (the "Library releases" key) |
| Update signing key | `DESKTOP_UPDATE_PRIVATE_KEY` | in `.env.production` |
| A storage disk the release machine and the server share | `STORAGE_DRIVER=s3` and its `AWS_S3_*` settings | not set up: the app only has the local disk, so a release made on a Mac cannot reach the server's |

Rehearsed on 2026-11-14 with a dry-run release served from a local feed: a
Developer ID build at 0.0.0 found 0.0.1, verified and installed it, restarted,
and reported 0.0.1. Notarization and a published release have not been run.

## Mac App Store

## Commands

```bash
./buddy dev:desktop                  # build the development app and open it
./buddy build:desktop                # storage/framework/desktop/macos/Notes.app (development signed)
./buddy desktop:apple:doctor         # what is missing for the Store, by name
./buddy desktop:apple:package        # sandboxed, Store-signed .pkg (needs the credentials below)
./buddy desktop:apple:publish --validate-only   # the same, validated by App Store Connect
```

Point a Store build at another server with `NOTES_API_URL=https://... ./buddy desktop:apple:package`.
The first build installs the pinned Zig through Pantry and builds the zig-js
engine into `~/.cache/craft/toolchain`; later builds reuse them.

## What the Store bundle contains

- `Contents/MacOS/Notes`: Craft's AppKit host, hardened runtime, no private
  APIs, no WebKit or JavaScriptCore linked.
- Entitlements: `com.apple.security.app-sandbox`, `com.apple.security.network.client`,
  `com.apple.application-identifier` (`3JJRNQW6B7.com.stacksjs.notes`),
  `com.apple.developer.team-identifier`, `keychain-access-groups`
  (`3JJRNQW6B7.com.stacksjs.notes`). The sign-in token is a Keychain item in that group.
- `Info.plist`: `LSApplicationCategoryType`, `LSMinimumSystemVersion`,
  `ITSAppUsesNonExemptEncryption = false`, `CFBundleIconFile`, versions.
- `Resources/PrivacyInfo.xcprivacy`: no tracking; email address, name and user
  content collected for app functionality (linked to the account); UserDefaults
  (CA92.1) and file timestamp (C617.1) required-reason APIs.
- `Resources/AppIcon.icns`, from the 1024 pixel master.
- `Contents/embedded.provisionprofile`.

Verified locally: the same bundle signed ad hoc **with the sandbox on** launches,
draws the sign-in screen, reaches the network client and keeps a Keychain item
across relaunches. What cannot be verified without the credentials is Apple's
own validation and the data-protection Keychain with the real access group.

## Credentials: what is required, what is present

Nothing below is committed. Variables are read by `desktop:apple:*`
(`buddy desktop:apple:doctor` lists whatever is missing). With the profile and both
identities set, `desktop:apple:package` makes the signed package. The app was renamed from
Library on 2026-11-14 and its bundle id changed with it, so the Store side starts again:
the rows below say what exists for `com.stacksjs.notes` and what does not yet.

| Needed | Variable | Status on this Mac |
|---|---|---|
| Bundle id registered with the Mac platform, Keychain Sharing off (the group is the app id) | n/a | not registered yet for `com.stacksjs.notes` (`buddy desktop:apple:provision --plan` shows what `--apply` would create) |
| Mac App Store provisioning profile for `com.stacksjs.notes` | `APPLE_PROVISIONING_PROFILE` (path to the `.provisionprofile`) | none yet: the existing "Library Mac App Store" profile in `~/.local/share/library-appstore/` is for the old bundle id and does not match |
| App signing identity (`Apple Distribution` or `3rd Party Mac Developer Application`) | `APPLE_APP_SIGNING_IDENTITY` | `Apple Distribution: Chris Breuer (3JJRNQW6B7)` is in the login keychain |
| Installer signing identity (`3rd Party Mac Developer Installer` / `Mac Installer Distribution`) | `APPLE_INSTALLER_SIGNING_IDENTITY` | `3rd Party Mac Developer Installer: Chris Breuer (3JJRNQW6B7)` is in the login keychain |
| App Store Connect API key id, issuer id and `.p8` | `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_API_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY` (the PEM text; `APP_STORE_CONNECT_API_KEY_PATH` also works) | key "Library releases" (App Manager) created 2026-10-31 and stored encrypted in `.env.production`; run with `APP_ENV=production` so the values load. The one-time `.p8` download is also kept in `~/.local/share/library-appstore/`. Needs a Stacks release with `withApiKeyFile` (v0.75.400+); older ones need `--api-key-path` |
| Build number that grows with each upload | `APPLE_BUILD_NUMBER` (default 1 in `config/desktop.ts`) | per upload |

`buddy desktop:apple:provision --plan` (with the API key) reports the Bundle ID,
capability, certificate and profile diff without changing anything, and `--apply`
creates what is missing. The Mac Installer Distribution certificate needs a CSR:
`buddy desktop:apple:csr` makes the key and request locally; the private key
never leaves the machine.

App Store Connect records (app listing, screenshots, privacy answers, review
notes, a demo account for review because the app needs an account) are made in
App Store Connect and are outside this repository.

## Known limits

- Single architecture: the host is built for the machine running the build
  (`--universal` is not supported for native apps yet).
- The development app (`build:desktop`) is signed ad hoc and not sandboxed, so it
  can use the login Keychain without a profile; only `desktop:apple:package`
  builds the sandboxed one.
