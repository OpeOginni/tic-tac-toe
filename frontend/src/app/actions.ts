'use server';

export async function getWebSocketUrl(): Promise<string> {
  // Use regular environment variable (not NEXT_PUBLIC_)
  const wsUrl = process.env.WS_URL || 'ws://localhost:8080';
  return wsUrl;
} 