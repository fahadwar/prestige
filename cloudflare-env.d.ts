declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    LIQUIPEDIA_API_KEY?: string;
    LIQUIPEDIA_ADMIN_EMAIL?: string;
  }
}
