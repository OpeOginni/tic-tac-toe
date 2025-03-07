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
      // Note: we're not passing the role parameter anymore since it's handled by the server
      router.push(`/game?room=${roomId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-8">
      <button
        onClick={() => startGame()}
        className="px-16 py-8 text-6xl rounded-2xl bg-gray-800 text-blue-400 hover:bg-gray-700 transition-all hover:scale-105"
        disabled={isLoading}
        style={{ fontFamily: 'Comic Sans MS' }}
      >
        X
      </button>
      <button
        onClick={() => startGame()}
        className="px-16 py-8 text-6xl rounded-2xl bg-gray-800 text-red-400 hover:bg-gray-700 transition-all hover:scale-105"
        disabled={isLoading}
        style={{ fontFamily: 'Comic Sans MS' }}
      >
        O
      </button>
    </div>
  );
} 