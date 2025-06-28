export default async (request: Request) => {
  const url = new URL(request.url)
  const targetUrl = `https://www.hut-reservation.org${url.pathname}${url.search}`

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'origin': 'https://www.hut-reservation.org'
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    })

    const responseHeaders = new Headers(response.headers)
    
    if (request.method === 'GET') {
      if (url.pathname.includes('/hutInfo/')) {
        responseHeaders.set('Cache-Control', 'public, max-age=86400') // 24 hours
        responseHeaders.set('Netlify-CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600')
        // Remove any conflicting cache headers from upstream
        responseHeaders.delete('Pragma')
        responseHeaders.delete('Expires')
      } else {
        responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        responseHeaders.set('Netlify-CDN-Cache-Control', 'no-cache')
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    })
  } catch (error) {
    console.error('API proxy error:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch from API' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

export const config = {
  path: "/api/*",
  cache: "manual"
}