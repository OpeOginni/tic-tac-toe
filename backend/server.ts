import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';

type Player = 'X' | 'O';
type Board = (Player | null)[][];
type GridSize = 3 | 4;
type GameState = {
  board: Board;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  scores: {
    X: number;
    O: number;
  };
  startingPlayer: Player;
  gridSize: GridSize;
  winningCells?: [number, number][];
};

type Game = {
  state: GameState;
  players: {
    X?: WebSocket;
    O?: WebSocket;
  };
  playerIds: {
    X?: string;
    O?: string;
  };
};

const games = new Map<string, Game>();

const server = createServer((req, res) => {
  // Add health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Handle other HTTP requests
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const wss = new WebSocketServer({ server });

function createInitialState(startingPlayer: Player = 'X', gridSize: GridSize = 3): GameState {
  return {
    board: Array(gridSize).fill(null).map(() => Array(gridSize).fill(null)),
    currentPlayer: startingPlayer,
    winner: null,
    scores: {
      X: 0,
      O: 0
    },
    startingPlayer,
    gridSize,
    winningCells: undefined,
  };
}

function broadcastGameState(game: Game) {
  Object.entries(game.players).forEach(([playerRole, ws]) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const otherRole = playerRole === 'X' ? 'O' : 'X';
      ws.send(JSON.stringify({ 
        type: 'state', 
        state: game.state,
        players: game.playerIds,
        role: playerRole,
        opponentConnected: !!game.players[otherRole as keyof typeof game.players]
      }));
    }
  });
}

wss.on('connection', (ws, req) => {
  const { url } = req;
  if (!url) return;

  const { query } = parse(url, true);
  const roomId = query.room as string;
  const playerId = query.playerId as string;
  const gridSizeParam = query.gridSize as string;
  
  if (!roomId || !playerId) {
    ws.close();
    return;
  }

  let role: Player;
  let gridSize: GridSize = 3;

  // Parse grid size with fallback
  try {
    const parsedSize = parseInt(gridSizeParam);
    if (parsedSize === 3 || parsedSize === 4) {
      gridSize = parsedSize;
    }
  } catch {
    gridSize = 3;
  }

  // Get or create game
  let game = games.get(roomId);

  if (!game) {
    // Create new game with specified grid size
    game = {
      state: createInitialState('X', gridSize),
      players: {},
      playerIds: {},
    };
    games.set(roomId, game);
  }

  // Determine player role
  if (game.playerIds.X === playerId) {
    role = 'X';
  } else if (game.playerIds.O === playerId) {
    role = 'O';
  } else {
    // Assign first available role
    const availableRole = !game.playerIds.X ? 'X' : !game.playerIds.O ? 'O' : undefined;
    if (!availableRole) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
      ws.close();
      return;
    }
    role = availableRole;
    game.playerIds[role] = playerId;
  }

  // Store WebSocket connection
  game.players[role] = ws;

  // Broadcast updated state to all players
  broadcastGameState(game);

  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'move' && role === game.state.currentPlayer) {
        const { row, col } = message;
        const { gridSize } = game.state;
        
        if (
          row >= 0 && row < gridSize && 
          col >= 0 && col < gridSize && 
          !game.state.board[row][col] &&
          !game.state.winner
        ) {
          // Make move
          game.state.board[row][col] = role;

          // Check winner
          const { winner, winningCells } = checkWinner(game.state.board, gridSize);
          game.state.winner = winner;
          game.state.winningCells = winningCells;
          
          // Update scores if there's a winner
          if (winner && winner !== 'draw') {
            game.state.scores[winner]++;
          }
          
          // Switch player
          game.state.currentPlayer = role === 'X' ? 'O' : 'X';

          // Broadcast new state
          broadcastGameState(game);
        }
      }
      
      else if (message.type === 'restart' && game.state.winner) {
        // Only allow restart if game is over and both players are connected
        if (game.players.X && game.players.O) {
          // Keep scores and alternate starting player
          const scores = { ...game.state.scores };
          const newStartingPlayer = game.state.startingPlayer === 'X' ? 'O' : 'X';
          game.state = createInitialState(newStartingPlayer, game.state.gridSize);
          game.state.scores = scores;
          
          // Broadcast new state
          broadcastGameState(game);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    if (game) {
      game.players[role] = undefined;
      
      // Only delete game if both players disconnect
      if (!game.players.X && !game.players.O) {
        games.delete(roomId);
      } else {
        // Broadcast updated state to remaining player
        broadcastGameState(game);
      }
    }
  });
});

function checkWinner(board: Board, gridSize: GridSize): { winner: Player | 'draw' | null; winningCells?: [number, number][] } {
  // Check rows
  for (let i = 0; i < gridSize; i++) {
    if (gridSize === 3) {
      // 3x3: Check full row
      if (board[i][0] && board[i][0] === board[i][1] && board[i][0] === board[i][2]) {
        return { 
          winner: board[i][0],
          winningCells: [[i,0], [i,1], [i,2]]
        };
      }
    } else {
      // 4x4: Check for 3 in a row
      for (let j = 0; j < 2; j++) {
        if (board[i][j] && 
            board[i][j] === board[i][j+1] && 
            board[i][j] === board[i][j+2]) {
          return { 
            winner: board[i][j],
            winningCells: [[i,j], [i,j+1], [i,j+2]]
          };
        }
      }
    }
  }

  // Check columns
  for (let i = 0; i < gridSize; i++) {
    if (gridSize === 3) {
      // 3x3: Check full column
      if (board[0][i] && board[0][i] === board[1][i] && board[0][i] === board[2][i]) {
        return {
          winner: board[0][i],
          winningCells: [[0,i], [1,i], [2,i]]
        };
      }
    } else {
      // 4x4: Check for 3 in a column
      for (let j = 0; j < 2; j++) {
        if (board[j][i] && 
            board[j][i] === board[j+1][i] && 
            board[j][i] === board[j+2][i]) {
          return {
            winner: board[j][i],
            winningCells: [[j,i], [j+1,i], [j+2,i]]
          };
        }
      }
    }
  }

  // Check diagonals
  if (gridSize === 3) {
    // 3x3: Check both diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[0][0] === board[2][2]) {
      return {
        winner: board[0][0],
        winningCells: [[0,0], [1,1], [2,2]]
      };
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[0][2] === board[2][0]) {
      return {
        winner: board[0][2],
        winningCells: [[0,2], [1,1], [2,0]]
      };
    }
  } else {
    // 4x4: Check for 3 in diagonal
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        // Check diagonal from top-left to bottom-right
        if (board[i][j] && 
            board[i][j] === board[i+1][j+1] && 
            board[i][j] === board[i+2][j+2]) {
          return {
            winner: board[i][j],
            winningCells: [[i,j], [i+1,j+1], [i+2,j+2]]
          };
        }
      }
    }

    for (let i = 0; i < 2; i++) {
      for (let j = 2; j < 4; j++) {
        // Check diagonal from top-right to bottom-left
        if (board[i][j] && 
            board[i][j] === board[i+1][j-1] && 
            board[i][j] === board[i+2][j-2]) {
          return {
            winner: board[i][j],
            winningCells: [[i,j], [i+1,j-1], [i+2,j-2]]
          };
        }
      }
    }
  }

  // Check for draw
  if (board.every(row => row.every(cell => cell !== null))) {
    return { winner: 'draw' };
  }

  return { winner: null };
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
}); 