'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type GridSize = 3 | 4;

export default function GameStarter() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGridSize, setSelectedGridSize] = useState<GridSize>(3);

  const startGame = async () => {
    setIsLoading(true);
    try {
      // Generate a random room ID
      const roomId = Math.random().toString(36).substring(2, 8);
      router.push(`/game?room=${roomId}&gridSize=${selectedGridSize}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-xl text-gray-300">Choose Grid Size</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedGridSize(3)}
            className={`px-6 py-3 rounded-lg transition-all ${
              selectedGridSize === 3
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            3x3 Classic
          </button>
          <button
            onClick={() => setSelectedGridSize(4)}
            className={`px-6 py-3 rounded-lg transition-all ${
              selectedGridSize === 4
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            4x4 Extended
          </button>
        </div>
      </div>
      
      <button
        onClick={startGame}
        className="px-16 py-8 text-2xl rounded-2xl bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all hover:scale-105"
        disabled={isLoading}
      >
        {isLoading ? 'Creating Game...' : `Start ${selectedGridSize}x${selectedGridSize} Game`}
      </button>
    </div>
  );
} 