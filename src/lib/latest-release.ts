import "server-only";

/**
 * Reads the newest published Android release from GitHub.
 *
 * The landing page shows a download button, so it needs a version number and a
 * file size. Both come from the release itself rather than being hardcoded,
 * because a hardcoded version silently goes stale the moment the next tag is
 * pushed, and the button would then offer an APK that is not the latest.
 *
 * Everything here is failure-tolerant on purpose. The download card is a
 * nicety on a page whose actual job is letting people sign in, so a GitHub
 * outage, a rate limit or a renamed asset must degrade to "no card" rather than
 * take the page down with it.
 */

const REPO = "thirapi/komunikasi-chat";
const API = `https://api.github.com/repos/${REPO}/releases/latest`;

/** Rebuild at most this often. A release is a rare event, not per-request news. */
const REVALIDATE_SECONDS = 3600;

export type AndroidRelease = {
  version: string;
  /** Human-readable size, e.g. "4.3 MB". */
  size: string;
  /** Short form of the published SHA-256, for the "verify" affordance. */
  checksum: string | null;
  /** Direct link to the .apk on github.com. */
  downloadUrl: string;
  /** Human-facing release page, offered alongside the raw file. */
  releaseUrl: string;
  publishedAt: string;
};

type GithubAsset = {
  name?: string;
  browser_download_url?: string;
  size?: number;
  updated_at?: string;
};

type GithubRelease = {
  tag_name?: string;
  html_url?: string;
  published_at?: string;
  assets?: GithubAsset[];
};

function formatSize(bytes: number | undefined): string {
  if (!bytes || bytes < 0) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 10 ? `${mb.toFixed(0)} MB` : `${mb.toFixed(1)} MB`;
}

/**
 * The checksum lives in a `.sha256` asset published next to the APK. The file
 * contains the digest followed by the filename, and we only want the digest.
 */
async function readChecksum(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    const text = await res.text();
    const digest = text.trim().split(/\s+/)[0];
    return /^[0-9a-f]{64}$/i.test(digest) ? digest : null;
  } catch {
    // The digest is supplementary; never fail the whole card over it.
    return null;
  }
}

export async function getLatestAndroidRelease(): Promise<AndroidRelease | null> {
  let payload: GithubRelease;
  try {
    const res = await fetch(API, {
      // Unauthenticated: this runs at request time on a public repo, and a
      // token would have to live in the deployment. The 60/hour limit is far
      // above what the revalidation window needs.
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    payload = (await res.json()) as GithubRelease;
  } catch {
    return null;
  }

  const apk = payload.assets?.find(
    (a) => a.name?.toLowerCase().endsWith(".apk") && a.browser_download_url,
  );
  if (!apk?.browser_download_url || !payload.html_url) return null;

  const sha = payload.assets?.find((a) => a.name?.toLowerCase().endsWith(".sha256"));
  const checksum = sha?.browser_download_url
    ? await readChecksum(sha.browser_download_url)
    : null;

  return {
    version: (payload.tag_name ?? apk.name ?? "").replace(/^v/, ""),
    size: formatSize(apk.size),
    checksum,
    // Kept on github.com on purpose: the APK is served over HTTPS from a
    // redirect to objects.githubusercontent.com, so the link is as verifiable
    // as a Play Store download and does not depend on a third-party store.
    downloadUrl: apk.browser_download_url,
    releaseUrl: payload.html_url,
    publishedAt: payload.published_at ?? apk.updated_at ?? "",
  };
}
