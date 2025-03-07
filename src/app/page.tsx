'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { randomBytes } from 'crypto';

type Player = 'X' | 'O';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const startGame = async (selectedRole: Player) => {
    setIsLoading(true);
    try {
      // Generate a random room ID
      const roomId = Math.random().toString(36).substring(2, 8);
      router.push(`/game?room=${roomId}&role=${selectedRole}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-12 text-white">Tic Tac Toe</h1>
        <p className="text-xl text-gray-400 mb-12">Choose your side to start a new game</p>
        <div className="flex gap-8">
          <button
            onClick={() => startGame('X')}
            className="px-16 py-8 text-6xl rounded-2xl bg-gray-800 text-blue-400 hover:bg-gray-700 transition-all hover:scale-105"
            disabled={isLoading}
            style={{ fontFamily: 'Comic Sans MS' }}
          >
            X
          </button>
          <button
            onClick={() => startGame('O')}
            className="px-16 py-8 text-6xl rounded-2xl bg-gray-800 text-red-400 hover:bg-gray-700 transition-all hover:scale-105"
            disabled={isLoading}
            style={{ fontFamily: 'Comic Sans MS' }}
          >
            O
          </button>
        </div>
      </div>
    </div>
  );
}
