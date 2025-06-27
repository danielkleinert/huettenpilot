
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

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch from API' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

export const config = {
  path: "/api/*"
}