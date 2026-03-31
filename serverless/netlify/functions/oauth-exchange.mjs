export default async (request, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), { status: 405, headers });
  }

  try {
    const body = await request.json();
    if (!body.code) {
      return new Response(JSON.stringify({ error: 'Missing OAuth code.' }), { status: 400, headers });
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'github-file-cms-proxy'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: body.code,
        redirect_uri: body.redirect_uri || undefined
      })
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return new Response(JSON.stringify({
        error: data.error || 'OAuth exchange failed.',
        details: data.error_description || data.error_uri || response.statusText
      }), { status: response.status || 400, headers });
    }

    return new Response(JSON.stringify({
      access_token: data.access_token,
      scope: data.scope || '',
      token_type: data.token_type || 'bearer'
    }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Unexpected function error.' }), { status: 500, headers });
  }
};
