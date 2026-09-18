const SOURCE = 'https://wubthvvtncflzkblgtzh.supabase.co/functions/v1/rge-cover-test?key=rge-cover-test-20260918-f72b1c9e&v=5';

export default {
  async fetch() {
    const response = await fetch(SOURCE, { redirect: 'follow' });
    if (!response.ok) {
      return new Response('cover unavailable', { status: 502 });
    }
    const bytes = await response.arrayBuffer();
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'no-store'
      }
    });
  }
};
