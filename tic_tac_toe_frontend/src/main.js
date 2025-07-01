import './style.css';

// PUBLIC_INTERFACE
/**
 * Minimal Tic Tac Toe UI connected to backend: board, turn indicators, status/result bar, restart button.
 * All UI game actions call the backend API and keep state in sync.
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
    status: 'playing', // 'playing' | 'won' | 'draw' | 'error'
    winner: null, // 'X' or 'O', if any
    error: undefined,
  };
}

// `checkGameStatus` removed – all state derived from backend response.

/**
 * Renders the game UI and attaches click handlers.
 */
function renderGame(state, onCellClick, onRestart) {
  app.innerHTML = '';

  // Status bar
  const statusBar = document.createElement('div');
  statusBar.className = 't3-statusbar';

  if (state.status === 'error') {
    statusBar.textContent = state.error ? `Backend error: ${state.error}` : 'Backend is unreachable.';
    statusBar.style.color = 'crimson';
  } else if (state.status === 'won') {
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
      cell.disabled =
        !!state.board[row][col] ||
        state.status !== 'playing' ||
        state.status === 'error';
      cell.setAttribute('data-row', row);
      cell.setAttribute('data-col', col);
      cell.onclick = () => onCellClick(row, col);
      grid.appendChild(cell);
    }
  }
  app.appendChild(grid);

  // Error details (if present)
  if (state.status === 'error' && state.error) {
    const errBox = document.createElement('div');
    errBox.style.color = 'crimson';
    errBox.style.fontSize = '0.98em';
    errBox.style.marginBottom = '10px';
    errBox.textContent = state.error;
    app.appendChild(errBox);
  }

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

/* global fetch */

// PUBLIC_INTERFACE
/**
 * REST API endpoints for backend integration.
 * Assumes backend base URL at /api/. Handles all error cases gracefully.
 */
const backendAPI = {
  backendBase: (typeof globalThis !== "undefined" && globalThis.API_BASE_URL) ? globalThis.API_BASE_URL : '/api',

  /**
   * Unified fetch wrapper for backend calls, handles network/API errors gracefully.
   * @param {string} url endpoint
   * @param {Object} options fetch options
   * @param {any} failFallback fallback game state on error
   */
  async safeFetch(url, options = {}, failFallback = null) {
    try {
      const resp = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      if (!resp.ok) {
        const err = await resp.text();
        return { error: err || 'Backend error', fallback: failFallback };
      }
      return await resp.json();
    } catch (err) {
      return { error: '' + err, fallback: failFallback };
    }
  },

  /**
   * Starts or resets a game (returns new board, turn, status)
   */
  async startGame() {
    const url = `${this.backendBase}/start`;
    const fallback = getInitialState();
    const data = await this.safeFetch(url, { method: 'POST' }, fallback);

    if (data.error) {
      fallback.status = 'error';
      fallback.error = data.error;
      return fallback;
    }
    return { ...data, error: undefined };
  },

  /**
   * Makes a move on the board via backend (returns updated board, turn, status)
   * @param {Array} board
   * @param {String} turn
   * @param {Number} row
   * @param {Number} col
   */
  async makeMove(board, turn, row, col) {
    const url = `${this.backendBase}/move`;
    const fallback = {
      board: board.map(arr => arr.slice()),
      turn,
      status: 'error',
      winner: null,
      error: 'Unable to contact backend.',
    };
    const data = await this.safeFetch(
      url,
      { method: 'POST', body: JSON.stringify({ board, turn, row, col }) },
      fallback
    );
    if (data.error) {
      fallback.error = data.error;
      return fallback;
    }
    return { ...data, error: undefined };
  },

  /**
   * Gets current game state (if needed; not used in minimal demo)
   */
  async getState() {
    const url = `${this.backendBase}/state`;
    const fallback = null;
    const data = await this.safeFetch(url, {}, fallback);
    if (data.error) return fallback;
    return data;
  },

  /**
   * Restarts the game (alias to startGame, but endpoint can differ)
   */
  async restartGame() {
    const url = `${this.backendBase}/restart`;
    const fallback = await this.startGame();
    const data = await this.safeFetch(url, { method: 'POST' }, fallback);

    if (data.error) {
      return fallback;
    }
    return { ...data, error: undefined };
  },
};

let gameState = getInitialState();

/**
 * Handles a move by communicating with backend.
 */
async function handleCellClick(row, col) {
  if (
    gameState.status !== 'playing' ||
    gameState.status === 'error' ||
    gameState.board[row][col]
  )
    return;
  gameState = await backendAPI.makeMove(gameState.board, gameState.turn, row, col);
  renderGame(gameState, handleCellClick, handleRestart);
}

/**
 * Handles restart, calls backend's restart endpoint.
 */
async function handleRestart() {
  gameState = await backendAPI.restartGame();
  renderGame(gameState, handleCellClick, handleRestart);
}

/**
 * Initializes the game by syncing state from backend.
 * If backend is offline, will allow retry by pressing Restart button.
 */
(async function init() {
  gameState = await backendAPI.startGame();
  renderGame(gameState, handleCellClick, handleRestart);
})();
