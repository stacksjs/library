import type { FilesystemsConfig } from '@stacksjs/types'
import { env } from '@stacksjs/env'

/**
 * **Filesystem Configuration**
 *
 * This configuration defines all of your filesystem/storage options. Because Stacks is fully-typed,
 * you may hover any of the options below and the definitions will be provided. In case
 * you have any questions, feel free to reach out via Discord or GitHub Discussions.
 *
 * @see https://stacksjs.com/docs/filesystems
 */
const s3Key = env.HETZNER_S3_ACCESS_KEY || env.AWS_ACCESS_KEY_ID
const s3Secret = env.HETZNER_S3_SECRET_KEY || env.AWS_SECRET_ACCESS_KEY

export default {
  /**
   * Which disk `Storage.disk()` returns when called with no name.
   *
   * Options: 'local', 'public', 's3'
   * - 'local':  private storage under `storage/app`
   * - 'public': web-accessible storage under `public/`
   * - 's3':     AWS S3 or S3-compatible storage; exists only once `s3.bucket`
   *             below is set
   *
   * This is a DISK, not an adapter. It defaulted to `'bun'` - an adapter name,
   * cast through `as any` because the type said adapters - so `Storage.disk()`
   * threw `Disk [bun] is not configured` in a stock app.
   */
  driver: env.STORAGE_DRIVER || 'local',

  /**
   * Root directory for local/bun drivers
   *
   * @default process.cwd()
   */
  root: env.STORAGE_ROOT || process.cwd(),

  /**
   * S3 Configuration (when driver is 's3')
   */
  s3: {
    bucket: env.AWS_S3_BUCKET || '',
    region: env.AWS_S3_REGION || env.AWS_REGION || 'us-east-1',
    prefix: env.AWS_S3_PREFIX || '',
    // The bucket's own keys. Hetzner Object Storage keys go in HETZNER_S3_*, so
    // they are never offered to the AWS services that read AWS_ACCESS_KEY_ID.
    credentials: s3Key && s3Secret ? { accessKeyId: s3Key, secretAccessKey: s3Secret } : undefined,
    // For S3-compatible services. Setting this turns on path-style addressing
    // (`host/bucket/key`) by default, which Hetzner and MinIO require.
    // Unset means AWS itself.
    endpoint: env.AWS_ENDPOINT || undefined,

    // Filebase, Cloudflare R2 and Google Cloud Storage serve virtual-hosted
    // style instead, so they need this off. `filebaseDisk()`, `r2Disk()` and
    // `gcsDisk()` from `@stacksjs/storage` set the whole disk up for you.
    // usePathStyleEndpoint: false,
  },

  /**
   * Public URL configuration
   */
  publicUrl: {
    domain: env.STORAGE_PUBLIC_URL || env.APP_URL || 'http://localhost',
  },

  /**
   * Default file visibility
   *
   * @default 'private'
   */
  defaultVisibility: 'private',
} satisfies FilesystemsConfig
