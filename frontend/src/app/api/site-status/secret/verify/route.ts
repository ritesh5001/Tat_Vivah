export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const verifyUrl = `${apiUrl}/v1/site-status/secret/verify`;

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Verify error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
