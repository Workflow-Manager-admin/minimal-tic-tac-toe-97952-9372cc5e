import './style.css';

// PUBLIC_INTERFACE
/**
 * Minimal Tic Tac Toe UI and game logic with board, turn indicators, status/result bar, and restart button.
 * Structure is ready for integrating backend REST calls.
 */

const COLORS = {
  primary: '#222831',
  secondary: '#393e46',
  accent: '#017aa2',
};

const app = document.getElementById('app');

/** Initial empty board state: 3x3 grid */
function getInitialState() {
  return {
    board: [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
    turn: 'X', // X always starts
    status: 'playing', // 'playing' | 'won' | 'draw'
    winner: null, // 'X' or 'O', if any
  };
}

// PUBLIC_INTERFACE
/**
 * Checks if someone has won, or the game is a draw.
 * Returns { status: 'playing'|'won'|'draw', winner: 'X'|'O'|null }
 */
function checkGameStatus(board) {
  // Rows, columns, diagonals
  const lines = [
    ...board, // rows
    [board[0][0], board[1][0], board[2][0]], // columns
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],
    [board[0][0], board[1][1], board[2][2]], // diag
    [board[0][2], board[1][1], board[2][0]], // anti-diag
  ];
  for (const line of lines) {
    if (line[0] && line[0] === line[1] && line[0] === line[2]) {
      return { status: 'won', winner: line[0] };
    }
  }
  // Check draw
  if (board.flat().every(cell => cell)) {
    return { status: 'draw', winner: null };
  }
  return { status: 'playing', winner: null };
}

/**
 * Renders the game UI and attaches click handlers.
 */
function renderGame(state, onCellClick, onRestart) {
  app.innerHTML = '';

  // Status bar
  const statusBar = document.createElement('div');
  statusBar.className = 't3-statusbar';
  if (state.status === 'won') {
    statusBar.textContent = `Winner: ${state.winner}`;
    statusBar.style.color = COLORS.accent;
  } else if (state.status === 'draw') {
    statusBar.textContent = 'Draw!';
    statusBar.style.color = COLORS.secondary;
  } else {
    statusBar.textContent = `Current turn: ${state.turn}`;
    statusBar.style.color = COLORS.secondary;
  }
  app.appendChild(statusBar);

  // Grid
  const grid = document.createElement('div');
  grid.className = 't3-grid';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cell = document.createElement('button');
      cell.className = 't3-cell';
      cell.textContent = state.board[row][col] || '';
      cell.disabled = !!state.board[row][col] || state.status !== 'playing';
      cell.setAttribute('data-row', row);
      cell.setAttribute('data-col', col);
      cell.onclick = () => onCellClick(row, col);
      grid.appendChild(cell);
    }
  }
  app.appendChild(grid);

  // Restart button
  const restartBtn = document.createElement('button');
  restartBtn.className = 't3-restart';
  restartBtn.textContent = 'Restart';
  restartBtn.onclick = onRestart;
  app.appendChild(restartBtn);

  // Footer (minimalistic)
  const footer = document.createElement('div');
  footer.className = 't3-footer';
  footer.textContent = 'Tic Tac Toe – Minimal UI';
  app.appendChild(footer);
}

// PUBLIC_INTERFACE
/**
 * Structure for backend integration (REST API endpoints)
 * Replace the bodies of these functions to connect to backend later.
 */
const backendAPI = {
  // async function to start/reset the game
  async startGame() {
    // Example for backend integration. Replace this with fetch('API_ENDPOINT/start', ...) as needed.
    // return fetch('/api/start', ...);
    return getInitialState();
  },
  // async function to make a move
  async makeMove(board, turn, row, col) {
    // Example for backend integration.
    // return fetch('/api/move', {method: 'POST', body: JSON.stringify({ board, turn, row, col })});
    const newBoard = board.map(arr => arr.slice());
    newBoard[row][col] = turn;
    const nextTurn = turn === 'X' ? 'O' : 'X';
    const res = checkGameStatus(newBoard);
    return {
      board: newBoard,
      turn: nextTurn,
      status: res.status,
      winner: res.winner,
    };
  },
  // async function to get current state (not used in this minimal demo)
  async getState() { return null; },
  // async function to restart (for REST structure, use startGame above)
  async restartGame() { return this.startGame(); },
};

// Stateful game wrapper
let gameState = getInitialState();

async function handleCellClick(row, col) {
  if (gameState.status !== 'playing' || gameState.board[row][col]) return;
  gameState = await backendAPI.makeMove(gameState.board, gameState.turn, row, col);
  renderGame(gameState, handleCellClick, handleRestart);
}

async function handleRestart() {
  gameState = await backendAPI.restartGame();
  renderGame(gameState, handleCellClick, handleRestart);
}

// Startup
(async function init() {
  gameState = await backendAPI.startGame();
  renderGame(gameState, handleCellClick, handleRestart);
})();
