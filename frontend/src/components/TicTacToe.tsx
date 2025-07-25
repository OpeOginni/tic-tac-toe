'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getWebSocketUrl } from '@/app/actions';

type Player = 'X' | 'O';
type Winner = Player | 'draw' | null;
type Board = (Player | null)[][];
type GridSize = 3 | 4;

type GameState = {
  board: Board;
  currentPlayer: Player;
  winner: Winner;
  scores: {
    X: number;
    O: number;
  };
  winningCells?: [number, number][];
  gridSize: GridSize;
};

export default function TicTacToe() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  // gridSize from URL is used when creating NEW games
  // For existing games, the actual grid size comes from the server state via WebSocket
  const gridSize = parseInt(searchParams.get('gridSize') || '3') as GridSize;
  const [playerId, setPlayerId] = useState<string>('');
  const [playerRole, setPlayerRole] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string>('');
  
  // Initialize playerId from localStorage on client side
  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId') || Math.random().toString(36).substring(2);
    setPlayerId(storedPlayerId);
    localStorage.setItem('playerId', storedPlayerId);
  }, []);

  // Fetch WebSocket URL from server action
  useEffect(() => {
    getWebSocketUrl().then(url => {
      console.log('WebSocket URL fetched from server:', url);
      setWsUrl(url);
    }).catch(err => {
      console.error('Failed to fetch WebSocket URL:', err);
      setWsUrl('ws://localhost:8080'); // fallback
    });
  }, []);

  // Initialize with default 3x3 board - will be updated by server state
  const [board, setBoard] = useState<Board>(Array(3).fill(null).map(() => Array(3).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Winner>(null);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [scores, setScores] = useState<GameState['scores']>({ X: 0, O: 0 });
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [gameGridSize, setGameGridSize] = useState<GridSize>(3);

  useEffect(() => {
    if (!roomId || !playerId || !wsUrl) return;

    // Connect to WebSocket with roomId, playerId, and gridSize
    // Note: gridSize is only used for new game creation, existing games ignore this
    const socketUrl = `${wsUrl}?room=${roomId}&playerId=${playerId}&gridSize=${gridSize}`;
    console.log('Connecting to WebSocket:', socketUrl); // Debug log
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log('WebSocket connected successfully');
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
        setGameGridSize(state.gridSize);
      }
      else if (data.type === 'error') {
        setError(data.message);
      }
      else if (data.type === 'playerDisconnected') {
        setOpponentConnected(false);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      setOpponentConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [roomId, playerId, gridSize, wsUrl]);

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
    // Don't include gridSize in shared links since it's stored in the server state
    navigator.clipboard.writeText(`${baseUrl}?room=${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWinningCell = (row: number, col: number) => {
    return winningCells.some(([r, c]) => r === row && c === col);
  };

  // Dynamic styling based on grid size
  const getCellSize = () => {
    return gameGridSize === 3 ? 'w-28 h-28' : 'w-20 h-20';
  };

  const getFontSize = () => {
    return gameGridSize === 3 ? 'text-7xl' : 'text-5xl';
  };

  const getGridCols = () => {
    return gameGridSize === 3 ? 'grid-cols-3' : 'grid-cols-4';
  };

  const getBorderCondition = (i: number, j: number) => {
    const maxIndex = gameGridSize - 1;
    return {
      borderBottom: i < maxIndex ? 'border-b-2' : '',
      borderRight: j < maxIndex ? 'border-r-2' : ''
    };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="p-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-6 text-white">Tic Tac Toe</h1>
          {error ? (
            <div className="mb-6">
              <p className="text-xl text-red-400">{error}</p>
              <Link href="/" className="mt-4 inline-block px-6 py-2 text-sm rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">
                Start New Game
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-lg text-gray-500 mb-2">{gameGridSize}x{gameGridSize} Grid</p>
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

        {!error && (
          <>
            <div className="mb-8 flex justify-center">
              <div className={`inline-grid ${getGridCols()} bg-gray-900`}>
                {board.map((row, i) =>
                  row.map((cell, j) => {
                    const { borderBottom, borderRight } = getBorderCondition(i, j);
                    return (
                      <button
                        key={`${i}-${j}`}
                        onClick={() => handleCellClick(i, j)}
                        disabled={!!winner || !!cell || currentPlayer !== playerRole || !isConnected || !opponentConnected}
                        className={`${getCellSize()} flex items-center justify-center transition-all
                          ${borderBottom} 
                          ${borderRight} 
                          border-gray-600
                          ${!cell && !winner && currentPlayer === playerRole && isConnected && opponentConnected
                            ? 'hover:bg-gray-800'
                            : ''
                        }`}
                        style={{ fontFamily: 'Comic Sans MS' }}
                      >
                        <span
                          className={`${getFontSize()} ${
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
                    );
                  })
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
          </>
        )}
      </div>
    </div>
  );
}