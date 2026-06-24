export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/v1/site-status`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Status fetch error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
