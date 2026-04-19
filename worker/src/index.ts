interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ALLOWED_ORIGIN: string;
}

const STATE_COOKIE = "oauth_state";
const STATE_COOKIE_MAX_AGE = 600;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/auth") return handleAuth(request, env);
    if (pathname === "/callback") return handleCallback(request, env);
    return new Response("Not found", { status: 404 });
  },
};

/**
 * Starts the OAuth flow.
 *
 * Generates a random state token, stashes it in an HttpOnly cookie (CSRF guard),
 * then 302-redirects the browser to GitHub's authorize page with `scope=public_repo`.
 * The cookie lives for 10 minutes, plenty of time to approve on GitHub and come back.
 */
function handleAuth(request: Request, env: Env): Response {
  const state = randomHex(16);
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${new URL(request.url).origin}/callback`,
    scope: "public_repo",
    state,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      "Set-Cookie": stateCookie(state, STATE_COOKIE_MAX_AGE),
    },
  });
}

/**
 * Finishes the OAuth flow after GitHub redirects back with `?code=...&state=...`.
 *
 * 1. Verifies the `state` query param matches the cookie we set in `/auth` (CSRF check).
 * 2. POSTs to GitHub's token endpoint with the code + client secret to get an access token.
 * 3. Returns an HTML popup that postMessages the token back to the opener (Decap's /admin page).
 *
 * All failure modes return a popup too, so Decap can surface the error in its UI
 * instead of the browser showing a blank page or raw JSON.
 */
async function handleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = readCookie(request.headers.get("cookie"), STATE_COOKIE);

  if (!code || !state || state !== cookieState) {
    return popupResponse(
      "error",
      { message: "Invalid state" },
      env.ALLOWED_ORIGIN,
    );
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return popupResponse(
      "error",
      { message: `GitHub returned ${tokenRes.status}` },
      env.ALLOWED_ORIGIN,
    );
  }

  const result = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!result.access_token) {
    return popupResponse(
      "error",
      {
        message: result.error_description ?? result.error ?? "No access token",
      },
      env.ALLOWED_ORIGIN,
    );
  }

  return popupResponse(
    "success",
    { token: result.access_token, provider: "github" },
    env.ALLOWED_ORIGIN,
  );
}

/**
 * Builds the popup HTML that hands the OAuth result back to Decap via `postMessage`.
 *
 * Decap's protocol: the popup first sends `"authorizing:github"` to its opener,
 * waits for a reply, then sends `"authorization:github:success:<json>"` (or error variant).
 * The opener's origin is hardcoded to `ALLOWED_ORIGIN` so a rogue embedder can't intercept the token.
 * Also clears the state cookie since it's single-use.
 */
function popupResponse(
  status: "success" | "error",
  content: unknown,
  targetOrigin: string,
): Response {
  const message = jsString(
    `authorization:github:${status}:${JSON.stringify(content)}`,
  );
  const origin = jsString(targetOrigin);

  const html = `<!doctype html>
<html><body><script>
(function () {
  function receive() {
    window.opener.postMessage(${message}, ${origin});
    window.removeEventListener('message', receive, false);
    window.close();
  }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;

  return new Response(html, {
    status: status === "success" ? 200 : 401,
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "Set-Cookie": stateCookie("", 0),
    },
  });
}

/**
 * Builds a `Set-Cookie` header for the OAuth state cookie.
 *
 * `HttpOnly` (no JS access), `Secure` (HTTPS only), `SameSite=Lax` (sent on GitHub's redirect back).
 * Pass `maxAge: 0` with an empty value to clear it after use.
 *
 * @example
 *   stateCookie("abc123", 600)
 *   // → "oauth_state=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600"
 */
function stateCookie(value: string, maxAge: number): string {
  return `${STATE_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

/**
 * Encodes a string as a JS literal safe to inline inside a `<script>` tag.
 *
 * `JSON.stringify` handles normal escaping (quotes, backslashes, newlines).
 * Replacing `<` with `\u003c` additionally prevents a value like `</script>`
 * from closing the surrounding script tag — a classic XSS breakout vector.
 *
 * @example
 *   jsString('hi')             // → '"hi"'
 *   jsString('</script>evil')  // → '"\\u003c/script>evil"'
 */
function jsString(value: string): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * Returns a cryptographically strong random hex string using the Web Crypto API.
 * Used for the OAuth state parameter.
 *
 * @example
 *   randomHex(4)  // → "a3f219cb" (8 hex chars = 4 bytes)
 */
function randomHex(bytes: number): string {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Extracts a single cookie value out of a `Cookie:` header.
 *
 * Workers doesn't ship a cookie parser and we only need one field, so a small
 * regex is enough. Returns null if the header is absent or the name isn't found.
 *
 * @example
 *   readCookie("a=1; oauth_state=abc", "oauth_state")  // → "abc"
 *   readCookie(null, "oauth_state")                    // → null
 */
function readCookie(header: string | null, name: string): string | null {
  return header?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1] ?? null;
}
