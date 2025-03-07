'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GameStarter() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const startGame = async () => {
    setIsLoading(true);
    try {
      // Generate a random room ID
      const roomId = Math.random().toString(36).substring(2, 8);
      router.push(`/game?room=${roomId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={startGame}
      className="px-16 py-8 text-2xl rounded-2xl bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all hover:scale-105"
      disabled={isLoading}
    >
      Start New Game
    </button>
  );
} 