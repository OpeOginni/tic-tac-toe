import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';

type Player = 'X' | 'O';
type Board = (Player | null)[][];
type GameState = {
  board: Board;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  scores: {
    X: number;
    O: number;
  };
  startingPlayer: Player;  // Track who starts each game
  winningCells?: [number, number][]; // Add winning cells coordinates
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

const server = createServer();
const wss = new WebSocketServer({ server });

function createInitialState(startingPlayer: Player = 'X'): GameState {
  return {
    board: Array(4).fill(null).map(() => Array(4).fill(null)),
    currentPlayer: startingPlayer,
    winner: null,
    scores: {
      X: 0,
      O: 0
    },
    startingPlayer
  };
}

function broadcastGameState(game: Game) {
  Object.entries(game.players).forEach(([playerRole, ws]) => {
    if (ws) {
      const otherRole = playerRole === 'X' ? 'O' : 'X';
      ws.send(JSON.stringify({ 
        type: 'state', 
        state: game.state,
        players: game.playerIds,
        role: playerRole,
        opponentConnected: !!game.players[otherRole]
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
  let role: Player;

  if (!roomId || !playerId) {
    ws.close();
    return;
  }

  // Create or get game
  let game = games.get(roomId);
  if (!game) {
    game = {
      state: createInitialState(),
      players: {},
      playerIds: {},
    };
    games.set(roomId, game);
  }

  // Check if player already has a role in this game
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
  }

  // Store player's connection and ID
  game.players[role] = ws;
  game.playerIds[role] = playerId;

  // Broadcast updated state to all players
  broadcastGameState(game);

  // Handle moves and restarts
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'move' && role === game.state.currentPlayer) {
        const { row, col } = message;
        if (
          row >= 0 && row < 4 && 
          col >= 0 && col < 4 && 
          !game.state.board[row][col] &&
          !game.state.winner
        ) {
          // Make move
          game.state.board[row][col] = role;
          
          // Check winner
          const { winner, winningCells } = checkWinner(game.state.board);
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
          game.state = createInitialState(newStartingPlayer);
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
      // Don't delete playerIds to persist roles
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

function checkWinner(board: Board): { winner: Player | 'draw' | null; winningCells?: [number, number][] } {
  // Check rows for 3 in a row
  for (let i = 0; i < 4; i++) {
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

  // Check columns for 3 in a row
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 4; j++) {
      if (board[i][j] && 
          board[i][j] === board[i+1][j] && 
          board[i][j] === board[i+2][j]) {
        return {
          winner: board[i][j],
          winningCells: [[i,j], [i+1,j], [i+2,j]]
        };
      }
    }
  }

  // Check diagonals for 3 in a row
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

  // Check for draw
  if (board.every(row => row.every(cell => cell !== null))) {
    return { winner: 'draw' };
  }

  return { winner: null };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
}); 