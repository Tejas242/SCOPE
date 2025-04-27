export async function GET() {
  return new Response(JSON.stringify({ status: 'API is running' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
