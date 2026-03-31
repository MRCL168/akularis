export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'github-oauth-proxy' }, 200, corsHeaders);
    }

    if (request.method === 'POST' && url.pathname === '/oauth/exchange') {
      try {
        const body = await request.json();
        if (!body.code) return json({ error: 'Missing OAuth code.' }, 400, corsHeaders);
        if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
          return json({ error: 'Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.' }, 500, corsHeaders);
        }

        const payload = {
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: body.code,
          redirect_uri: body.redirect_uri || undefined
        };

        const response = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'github-file-cms-proxy'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          return json({
            error: data.error || 'OAuth exchange failed.',
            details: data.error_description || data.error_uri || response.statusText
          }, response.status || 400, corsHeaders);
        }

        return json({
          access_token: data.access_token,
          scope: data.scope || '',
          token_type: data.token_type || 'bearer'
        }, 200, corsHeaders);
      } catch (error) {
        return json({ error: error.message || 'Unexpected worker error.' }, 500, corsHeaders);
      }
    }

    return json({ error: 'Not found.' }, 404, corsHeaders);
  }
};

function json(payload, status, headers) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {})
  });
}
