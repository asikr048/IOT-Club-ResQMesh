import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing "url" query parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LoRa-Mesh-EOC-Dashboard/1.0'
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned status ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch upstream URL';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
