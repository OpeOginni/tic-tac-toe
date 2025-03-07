'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Player = 'X' | 'O';
type Winner = Player | 'draw' | null;
type Board = (Player | null)[][];

type GameState = {
  board: Board;
  currentPlayer: Player;
  winner: Winner;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export default function TicTacToe() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const [playerRole, setPlayerRole] = useState<Player | null>(null);
  const [playerId] = useState(() => localStorage.getItem('playerId') || Math.random().toString(36).substring(2));
  
  const [board, setBoard] = useState<Board>(Array(3).fill(null).map(() => Array(3).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Winner>(null);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);

  // Store playerId in localStorage
  useEffect(() => {
    localStorage.setItem('playerId', playerId);
  }, [playerId]);

  // Connect to WebSocket
  useEffect(() => {
    if (!roomId) {
      router.push('/');
      return;
    }

    const wsUrl = `${WS_URL}?room=${roomId}&playerId=${playerId}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'state') {
        const { state, players, role } = data;
        setBoard(state.board);
        setCurrentPlayer(state.currentPlayer);
        setWinner(state.winner);
        
        // Set role if provided
        if (role) {
          setPlayerRole(role);
        }
        
        // Check if opponent is connected
        const opponentRole = role === 'X' ? 'O' : 'X';
        setOpponentConnected(!!players[opponentRole]);
      }
      
      else if (data.type === 'playerDisconnected') {
        setOpponentConnected(false);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setOpponentConnected(false);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [roomId, playerId, router]);

  const handleCellClick = (row: number, col: number) => {
    if (!ws || board[row][col] || winner || currentPlayer !== playerRole || !isConnected) return;

    ws.send(JSON.stringify({
      type: 'move',
      row,
      col,
    }));
  };

  const handleRestart = () => {
    if (!ws || !winner || !opponentConnected) return;
    ws.send(JSON.stringify({ type: 'restart' }));
  };

  const copyRoomLink = () => {
    const baseUrl = window.location.href.split('?')[0];
    navigator.clipboard.writeText(`${baseUrl}?room=${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomId) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="p-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-6 text-white">Tic Tac Toe</h1>
          <div className="mb-6">
            <p className="text-xl text-gray-400">
              You are playing as{' '}
              <span 
                className={playerRole === 'X' ? 'text-blue-400' : 'text-red-400'}
                style={{ fontFamily: 'Comic Sans MS' }}
              >
                {playerRole || '...'}
              </span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {!isConnected ? '🔴 Connecting...' : 
               !opponentConnected ? '🟡 Waiting for opponent...' : 
               '🟢 Game in progress'}
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={copyRoomLink}
              className="px-6 py-2 text-sm rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
            >
              {copied ? '✓ Copied!' : 'Share Game Link'}
            </button>
            {winner && opponentConnected && (
              <button
                onClick={handleRestart}
                className="px-6 py-2 text-sm rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
              >
                Restart Game
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-gray-600 p-px mb-8">
          {board.map((row, i) =>
            row.map((cell, j) => (
              <button
                key={`${i}-${j}`}
                onClick={() => handleCellClick(i, j)}
                disabled={!!winner || !!cell || currentPlayer !== playerRole || !isConnected || !opponentConnected}
                className={`w-24 h-24 bg-gray-900 flex items-center justify-center transition-all ${
                  !cell && !winner && currentPlayer === playerRole && isConnected && opponentConnected
                    ? 'hover:bg-gray-800'
                    : ''
                }`}
                style={{ fontFamily: 'Comic Sans MS' }}
              >
                <span
                  className={`text-6xl ${
                    cell === 'X'
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }`}
                >
                  {cell}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="text-center text-lg">
          {winner ? (
            <p className="text-green-400 font-semibold">
              {winner === 'draw' ? "It's a draw!" : `Player ${winner} wins!`}
            </p>
          ) : (
            <p className={`font-semibold ${currentPlayer === playerRole ? 'text-blue-400' : 'text-gray-400'}`}>
              {!isConnected ? 'Connecting...' : 
               !opponentConnected ? 'Waiting for opponent...' :
               currentPlayer === playerRole ? 'Your turn' : 
               `Waiting for player ${currentPlayer}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 