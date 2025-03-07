'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Player = 'X' | 'O';
type Winner = Player | 'draw' | null;
type Board = (Player | null)[][];

type GameState = {
  board: Board;
  currentPlayer: Player;
  winner: Winner;
  scores: {
    X: number;
    O: number;
  };
  winningCells?: [number, number][];
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export default function TicTacToe() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const [playerId, setPlayerId] = useState<string>('');
  const [playerRole, setPlayerRole] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize playerId from localStorage on client side
  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId') || Math.random().toString(36).substring(2);
    setPlayerId(storedPlayerId);
    localStorage.setItem('playerId', storedPlayerId);
  }, []);

  const [board, setBoard] = useState<Board>(Array(3).fill(null).map(() => Array(3).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Winner>(null);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [scores, setScores] = useState<GameState['scores']>({ X: 0, O: 0 });
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!roomId || !playerId) return;

    // Connect to WebSocket with only roomId and playerId
    const wsUrl = `${WS_URL}?room=${roomId}&playerId=${playerId}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'state') {
        const { state, role, opponentConnected } = data;
        setBoard(state.board);
        setCurrentPlayer(state.currentPlayer);
        setWinner(state.winner);
        setPlayerRole(role);
        setOpponentConnected(opponentConnected);
        setScores(state.scores);
        setWinningCells(state.winningCells || []);
      }
      else if (data.type === 'error') {
        setError(data.message);
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
  }, [roomId, playerId]);

  const handleCellClick = (row: number, col: number) => {
    if (!ws || board[row][col] || winner || currentPlayer !== playerRole || !isConnected || !opponentConnected) return;

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

  const isWinningCell = (row: number, col: number) => {
    return winningCells.some(([r, c]) => r === row && c === col);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="p-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-6 text-white">H&B Tic Tac Toe</h1>
          {error ? (
            <div className="mb-6">
              <p className="text-xl text-red-400">{error}</p>
              <a href="/" className="mt-4 inline-block px-6 py-2 text-sm rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">
                Start New Game
              </a>
            </div>
          ) : (
            <>
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
                <div className="flex justify-center gap-8 mt-4">
                  <p className="text-blue-400">X: {scores.X}</p>
                  <p className="text-red-400">O: {scores.O}</p>
                </div>
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
                    {`Restart (${currentPlayer} starts next)`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mb-8 flex justify-center">
          <div className="inline-grid grid-cols-3 bg-gray-900">
            {board.map((row, i) =>
              row.map((cell, j) => (
                <button
                  key={`${i}-${j}`}
                  onClick={() => handleCellClick(i, j)}
                  disabled={!!winner || !!cell || currentPlayer !== playerRole || !isConnected || !opponentConnected}
                  className={`w-28 h-28 flex items-center justify-center transition-all
                    ${i < 2 ? 'border-b-2' : ''} 
                    ${j < 2 ? 'border-r-2' : ''} 
                    border-gray-600
                    ${!cell && !winner && currentPlayer === playerRole && isConnected && opponentConnected
                      ? 'hover:bg-gray-800'
                      : ''
                  }`}
                  style={{ fontFamily: 'Comic Sans MS' }}
                >
                  <span
                    className={`text-7xl ${
                      isWinningCell(i, j)
                        ? 'text-green-400'
                        : cell === 'X'
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