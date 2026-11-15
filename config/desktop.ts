import type { DesktopConfig } from '@stacksjs/types'
import process from 'node:process'
import pkg from '../package.json'

/**
 * The Mac app: the stx screens in resources/native drawn by Craft's AppKit
 * host (no web view), a client of the same HTTP API as the website.
 *
 * `buddy dev:desktop` builds it and opens it; `buddy build:desktop` builds it.
 * It ships two ways from this one config:
 *
 *   - Directly, signed with Developer ID and notarized: `bun run release:mac`
 *     (`buddy release:desktop`). That build updates itself from `updates.feedUrl`,
 *     and is what Pantry publishes (`pantry.json`).
 *   - Through the Mac App Store: `bun run release:testflight`. A Store build is
 *     sandboxed and carries no updater; the Store updates it.
 *
 * `url` is the server the app talks to: production for a production build
 * (`APP_ENV=production`, which every release script sets), the local API
 * otherwise, and `NOTES_API_URL` over both. Updates are asked of the same
 * server, so a development build can rehearse one against the local API.
 *
 * `version` is package.json's: `buddy release` bumps it, and the updater
 * compares it with the feed's.
 */
const env = process.env
const production = env.APP_ENV === 'production'
const url = env.NOTES_API_URL || (production ? 'https://library.stacksjs.com' : 'http://127.0.0.1:3408')

export default {
  macos: {
    appName: 'Notes',
    bundleId: 'com.stacksjs.notes',
    // The Apple Developer team, not a secret: it is in every signed bundle.
    teamId: env.APPLE_TEAM_ID || '3JJRNQW6B7',
    version: pkg.version,
    buildNumber: env.APPLE_BUILD_NUMBER || '1',
    minimumSystemVersion: '13.0',
    category: 'public.app-category.productivity',
    url,
    updates: {
      feedUrl: `${url}/api/updates`,
      // The public half of the key that signs update manifests. The private half
      // is DESKTOP_UPDATE_PRIVATE_KEY, encrypted in .env.production.
      publicKeys: { main: 'ed25519-public:MCowBQYDK2VwAyEAEqWkrTTHpGIYjIVRxr4MHgB4cKkYT2bvUM7R1WNVpaU' },
    },
    nativeScreens: ['Main', 'Settings'],
    nativeScreensDir: 'resources/native',
    initialScreen: 'Main',
    // The sign-in token lives in the Keychain under `auth.token`, which is what
    // `craft.session` reads; nothing else is shared.
    shareStorage: { auth_token: 'auth.token' },
    // Content runs under the title bar, as in Things: the sidebar reaches the top
    // of the window and the traffic lights sit on it.
    window: { width: 1180, height: 760, minWidth: 860, minHeight: 540, titlebarStyle: 'transparent', trafficLights: [20, 20] },
    icon: 'resources/native/icon/AppIcon-1024.png',
    sandbox: true,
    privacy: {
      tracking: false,
      collectedDataTypes: [
        { type: 'NSPrivacyCollectedDataTypeEmailAddress', linked: true, tracking: false, purposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'] },
        { type: 'NSPrivacyCollectedDataTypeName', linked: true, tracking: false, purposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'] },
        { type: 'NSPrivacyCollectedDataTypeOtherUserContent', linked: true, tracking: false, purposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'] },
      ],
      accessedApiTypes: [
        { type: 'NSPrivacyAccessedAPICategoryUserDefaults', reasons: ['CA92.1'] },
        { type: 'NSPrivacyAccessedAPICategoryFileTimestamp', reasons: ['C617.1'] },
      ],
    },
  },
} satisfies DesktopConfig
