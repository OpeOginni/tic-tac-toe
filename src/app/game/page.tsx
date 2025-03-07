import { redirect } from 'next/navigation';
import TicTacToe from '@/components/TicTacToe';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tic Tac Toe - Game',
  description: 'Play Tic Tac Toe with a friend in real-time',
};

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function GamePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const roomId = typeof params.room === 'string' ? params.room : undefined;

  if (!roomId) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <TicTacToe />
    </div>
  );
}