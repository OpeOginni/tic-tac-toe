export async function GET() {
  return Response.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'tic-tac-toe-frontend'
  });
} 