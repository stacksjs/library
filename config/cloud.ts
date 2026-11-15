import type { CloudConfig } from '@stacksjs/types'
import type { CloudConfig as TsCloudConfig } from '@stacksjs/ts-cloud'
import { env } from '@stacksjs/env'

// The app was called Library when this tenant was created. Its slug, its
// domain and `/var/lib/library` name files, a certificate and a database that
// exist on the box, so they keep that name: changing one here would start an
// empty tenant beside the live one instead of renaming it.
const APP_SLUG = 'library'
const APP_DOMAIN = env.APP_DOMAIN || 'library.stacksjs.com'

/**
 * Where files are kept: the bucket the Mac release publishes update files to
 * and the server's update feed reads them from. Both sites get it, because
 * either may be asked for a file. Empty values leave the local disk in place.
 */
const STORAGE_ENV = {
  STORAGE_DRIVER: env.STORAGE_DRIVER || 'local',
  AWS_S3_BUCKET: env.AWS_S3_BUCKET || '',
  AWS_S3_REGION: env.AWS_S3_REGION || '',
  AWS_ENDPOINT: env.AWS_ENDPOINT || '',
  HETZNER_S3_ACCESS_KEY: env.HETZNER_S3_ACCESS_KEY || '',
  HETZNER_S3_SECRET_KEY: env.HETZNER_S3_SECRET_KEY || '',
}

/**
 * Cloud configuration.
 *
 * Notes is a TENANT on the shared Hetzner box the `stacks` project owns
 * (`cloud.attachTo`), not a box of its own. Two rules follow, and both have
 * caused outages on that box before:
 *
 *   1. `project.slug` names the files this deploy OWNS on the box:
 *      `/etc/rpx/sites.d/<slug>.json` and `rpx-cert-renew-<slug>.*`. The
 *      fragment is replaced wholesale, so a slug colliding with another tenant
 *      deletes that tenant's routes.
 *   2. Ports must be clear of every other tenant. 3250/3258 are the first free
 *      pair on a live `ss -lntp` of the box (3248 was the highest taken).
 *      Reading another tenant's config file instead is how two services end up
 *      quietly bound to one port.
 *
 * The data is real people's tasks, notes and prompts, so unlike the demo
 * tenants nothing here rebuilds the schema: `migrate` applies new files and
 * leaves what exists alone.
 */
export const tsCloud: TsCloudConfig = {
  project: {
    name: APP_SLUG,
    slug: APP_SLUG,
    region: 'us-east-1',
  },

  stateDir: 'storage/cloud',

  cloud: {
    provider: 'hetzner',
    // Join the box the `stacks` project provisions instead of creating one.
    attachTo: 'stacks',
  },

  mode: 'server',

  environments: {
    production: {
      type: 'production',
      deployBranch: 'main',
      region: 'us-east-1',
      variables: {
        APP_ENV: 'production',
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
    },
  },

  infrastructure: {
    /**
     * DNS lives on Cloudflare, which is authoritative for the whole
     * `stacksjs.com` zone: this app owns one name on it, not the zone. `domain`
     * is the zone apex so ts-cloud knows where `library.stacksjs.com` lives.
     *
     * No `cdn` block, on purpose. Cloudflare settings and cache rules are
     * ZONE-WIDE, and a tenant that declares them rewrites every other tenant's
     * (one tenant's deploy replaced all the `[ts-cloud]` cache rules on this
     * zone). Notes is served straight from the box over its own certificate.
     * `records` stays empty for the same reason: the zone's mail, DKIM and
     * validation records belong to the zone owner.
     */
    dns: {
      provider: 'cloudflare',
      domain: 'stacksjs.com',
    },

    compute: {
      instances: 1,
      size: 'small',
      disk: {
        size: 20,
        type: 'ssd',
        encrypted: true,
      },
      webServer: 'rpx',
      proxy: {
        engine: 'rpx',
        // Emits this tenant's own cert units rather than sitting on the box's
        // fallback certificate.
        onDemandTls: true,
      },
    },
  },

  sites: {
    /**
     * The stx app server: the web app, and the front door for the API.
     *
     * The database and the migration baseline live in `/var/lib/library`,
     * outside the atomic release directories. Inside one, every push would
     * swap in a fresh empty database. The baseline needs the same care: the
     * differ's snapshot defaults to a path inside the project, so a new release
     * would re-derive the schema from nothing and re-propose destructive
     * changes on every deploy.
     */
    main: {
      root: '.',
      path: '/',
      domain: APP_DOMAIN,
      start: 'bun node_modules/@stacksjs/buddy/dist/serve-entry.js',
      port: 3250,
      preStart: [
        'bun install --frozen-lockfile',
        'mkdir -p /var/lib/library/db-snapshot',
        'bun node_modules/@stacksjs/buddy/dist/cli.js migrate',
      ],
      env: {
        HOST: '127.0.0.1',
        APP_ENV: 'production',
        NODE_ENV: 'production',
        APP_NAME: 'Notes',
        APP_URL: APP_DOMAIN,
        APP_KEY: env.APP_KEY || '',
        PORT_API: '3258',
        API_URL: 'http://127.0.0.1:3258',
        // The framework's auth routes (login, register, logout, refresh) and
        // nothing else: naming a bundle keeps the dashboard, commerce, CMS and
        // AI routes this app never uses off the public surface.
        STACKS_DEFAULT_ROUTES: 'auth',
        // Both names, on purpose: the app reads DB_DATABASE_PATH for SQLite and
        // ts-cloud's pre-flight looks for DB_DATABASE.
        DB_CONNECTION: 'sqlite',
        DB_DATABASE: '/var/lib/library/library.sqlite',
        DB_DATABASE_PATH: '/var/lib/library/library.sqlite',
        DB_SNAPSHOT_PATH: '/var/lib/library/db-snapshot',
        // No mail server is configured yet: write the welcome email to the log
        // instead of failing a connection to a local SMTP port on every signup.
        MAIL_MAILER: 'log',
        ...STORAGE_ENV,
      },
    },

    // API (bun-router). Deliberately no `domain`/`path`: the rpx gateway skips
    // domain-less sites, so this stays loopback-only and is reached only
    // through the main site.
    api: {
      root: '.',
      start: 'bun node_modules/@stacksjs/actions/dist/serve/api.js',
      port: 3258,
      preStart: ['bun install --frozen-lockfile'],
      env: {
        HOST: '127.0.0.1',
        APP_ENV: 'production',
        NODE_ENV: 'production',
        APP_NAME: 'Notes',
        APP_URL: APP_DOMAIN,
        APP_KEY: env.APP_KEY || '',
        STACKS_DEFAULT_ROUTES: 'auth',
        DB_CONNECTION: 'sqlite',
        DB_DATABASE: '/var/lib/library/library.sqlite',
        DB_DATABASE_PATH: '/var/lib/library/library.sqlite',
        DB_SNAPSHOT_PATH: '/var/lib/library/db-snapshot',
        MAIL_MAILER: 'log',
        ...STORAGE_ENV,
      },
    },
  },
}

const config: CloudConfig = {}

export default config
