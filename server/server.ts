import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';

type Player = 'X' | 'O';
type Board = (Player | null)[][];
type GameState = {
  board: Board;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
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

function createInitialState(): GameState {
  return {
    board: Array(3).fill(null).map(() => Array(3).fill(null)),
    currentPlayer: 'X',
    winner: null,
  };
}

function broadcastGameState(game: Game) {
  Object.values(game.players).forEach((player) => {
    player?.send(JSON.stringify({ 
      type: 'state', 
      state: game.state,
      players: game.playerIds // Send player IDs so client knows who is who
    }));
  });
}

wss.on('connection', (ws, req) => {
  const { url } = req;
  if (!url) return;

  const { query } = parse(url, true);
  const roomId = query.room as string;
  const playerId = query.playerId as string;
  let role = query.role as Player;

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
  } else if (!role || (game.playerIds[role] && game.playerIds[role] !== playerId)) {
    // Assign available role if none specified or requested role is taken
    const availableRole = !game.playerIds.X ? 'X' : !game.playerIds.O ? 'O' : undefined;
    if (!availableRole) {
      ws.close();
      return;
    }
    role = availableRole;
  }

  // Store player's connection and ID
  game.players[role] = ws;
  game.playerIds[role] = playerId;

  // Send initial state
  ws.send(JSON.stringify({ 
    type: 'state', 
    state: game.state,
    players: game.playerIds,
    role // Send assigned role back to client
  }));

  // Handle moves and restarts
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'move' && role === game.state.currentPlayer) {
        const { row, col } = message;
        if (
          row >= 0 && row < 3 && 
          col >= 0 && col < 3 && 
          !game.state.board[row][col] &&
          !game.state.winner
        ) {
          // Make move
          game.state.board[row][col] = role;
          
          // Check winner
          game.state.winner = checkWinner(game.state.board);
          
          // Switch player
          game.state.currentPlayer = role === 'X' ? 'O' : 'X';

          // Broadcast new state
          broadcastGameState(game);
        }
      }
      
      else if (message.type === 'restart' && game.state.winner) {
        // Only allow restart if game is over and both players are connected
        if (game.players.X && game.players.O) {
          game.state = createInitialState();
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
        // Notify other player about disconnect
        const otherRole = role === 'X' ? 'O' : 'X';
        game.players[otherRole]?.send(JSON.stringify({ type: 'playerDisconnected' }));
      }
    }
  });
});

function checkWinner(board: Board): Player | 'draw' | null {
  // Check rows, columns and diagonals
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][0] === board[i][2]) {
      return board[i][0];
    }
    if (board[0][i] && board[0][i] === board[1][i] && board[0][i] === board[2][i]) {
      return board[0][i];
    }
  }

  if (board[0][0] && board[0][0] === board[1][1] && board[0][0] === board[2][2]) {
    return board[0][0];
  }
  if (board[0][2] && board[0][2] === board[1][1] && board[0][2] === board[2][0]) {
    return board[0][2];
  }

  // Check for draw
  if (board.every(row => row.every(cell => cell !== null))) {
    return 'draw';
  }

  return null;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
}); 