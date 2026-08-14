// ゲームロジック（盤面・落下・回転・衝突判定・得点計算）を担当する。
// APIとの通信やDOM操作（画面遷移）はscreens.jsが担当し、このファイルは持たない。

const BOARD_COLS = 10;
const BOARD_ROWS = 20;
const CELL_SIZE = 28;
const NEXT_CELL_SIZE = 18;
const NEXT_PREVIEW_COUNT = 3;

const LINE_SCORES = { 1: 100, 2: 300, 3: 500, 4: 800 };

const TETROMINO_COLORS = {
  I: "#00e0e0",
  O: "#e0e000",
  T: "#a000e0",
  S: "#00c000",
  Z: "#e00000",
  J: "#3060f0",
  L: "#e0900a",
};

// 各テトリミノの基本形（回転状態0）を4x4グリッドで定義する。
const TETROMINO_BASE_SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
  ],
  T: [
    [0, 0, 0, 0],
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
  ],
  S: [
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
  ],
  Z: [
    [0, 0, 0, 0],
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [0, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
  ],
  L: [
    [0, 0, 0, 0],
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
  ],
};

function rotateGridClockwise(grid) {
  const n = grid.length;
  const result = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      result[x][n - 1 - y] = grid[y][x];
    }
  }
  return result;
}

// 回転状態0/R/2/Lの4パターンをあらかじめテーブルとして生成しておく。
const TETROMINO_SHAPES = Object.fromEntries(
  Object.entries(TETROMINO_BASE_SHAPES).map(([type, base]) => {
    const states = [base];
    for (let i = 1; i < 4; i++) {
      states.push(rotateGridClockwise(states[i - 1]));
    }
    return [type, states];
  })
);

const TETROMINO_TYPES = Object.keys(TETROMINO_SHAPES);

function getShapeCells(type, rotation) {
  const grid = TETROMINO_SHAPES[type][rotation];
  const cells = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x]) cells.push({ x, y });
    }
  }
  return cells;
}

class TetrisGame {
  constructor({ boardCanvas, nextCanvas, onStateChange, onGameOver, onQueueLow }) {
    this.boardCtx = boardCanvas.getContext("2d");
    this.nextCtx = nextCanvas.getContext("2d");
    this.onStateChange = onStateChange || (() => {});
    this.onGameOver = onGameOver || (() => {});
    this.onQueueLow = onQueueLow || (() => {});

    this._handleKeydown = this._handleKeydown.bind(this);
    this._loop = this._loop.bind(this);
  }

  start(difficultySetting, initialQueue) {
    this.difficultyName = difficultySetting.name;
    this.initialFallSpeedMs = difficultySetting.initial_fall_speed_ms;
    this.scoreMultiplier = difficultySetting.score_multiplier;

    this.board = Array.from({ length: BOARD_ROWS }, () => new Array(BOARD_COLS).fill(null));
    this.queue = [...initialQueue];
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.fallSpeedMs = this.initialFallSpeedMs;
    this.dropTimer = 0;
    this.lastTime = null;
    this.running = true;

    this._spawnPiece();
    this._notifyState();

    window.addEventListener("keydown", this._handleKeydown);
    this.animationFrameId = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    window.removeEventListener("keydown", this._handleKeydown);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  enqueue(types) {
    this.queue.push(...types);
  }

  _notifyState() {
    this.onStateChange({
      score: this.score,
      level: this.level,
      lines: this.linesCleared,
    });
  }

  _spawnPiece() {
    const type = this.queue.shift();
    this.currentType = type;
    this.currentRotation = 0;
    this.currentX = 3;
    this.currentY = 0;

    if (this.queue.length < 7) {
      this.onQueueLow();
    }

    if (!this._isValidPosition(this.currentType, this.currentRotation, this.currentX, this.currentY)) {
      this.running = false;
      window.removeEventListener("keydown", this._handleKeydown);
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.onGameOver({ score: this.score, level: this.level, lines: this.linesCleared });
    }
  }

  _isValidPosition(type, rotation, posX, posY) {
    const cells = getShapeCells(type, rotation);
    for (const cell of cells) {
      const boardX = posX + cell.x;
      const boardY = posY + cell.y;
      if (boardX < 0 || boardX >= BOARD_COLS || boardY >= BOARD_ROWS) return false;
      if (boardY < 0) continue;
      if (this.board[boardY][boardX]) return false;
    }
    return true;
  }

  _handleKeydown(e) {
    if (!this.running) return;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        this._tryMove(-1, 0);
        break;
      case "ArrowRight":
        e.preventDefault();
        this._tryMove(1, 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        this._tryRotate();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!this._tryMove(0, 1)) {
          this._lockPiece();
        } else {
          this.dropTimer = 0;
        }
        break;
      case " ":
        e.preventDefault();
        this._hardDrop();
        break;
    }
  }

  _tryMove(dx, dy) {
    const newX = this.currentX + dx;
    const newY = this.currentY + dy;
    if (this._isValidPosition(this.currentType, this.currentRotation, newX, newY)) {
      this.currentX = newX;
      this.currentY = newY;
      return true;
    }
    return false;
  }

  _tryRotate() {
    const newRotation = (this.currentRotation + 1) % 4;
    // 壁蹴りは行わない簡易回転方式：衝突する場合は回転をキャンセルする
    if (this._isValidPosition(this.currentType, newRotation, this.currentX, this.currentY)) {
      this.currentRotation = newRotation;
    }
  }

  _hardDrop() {
    while (this._tryMove(0, 1)) {
      // 衝突するまで下に移動し続ける
    }
    this._lockPiece();
  }

  _lockPiece() {
    const cells = getShapeCells(this.currentType, this.currentRotation);
    for (const cell of cells) {
      const boardX = this.currentX + cell.x;
      const boardY = this.currentY + cell.y;
      if (boardY >= 0) {
        this.board[boardY][boardX] = TETROMINO_COLORS[this.currentType];
      }
    }

    this._clearLines();
    this.dropTimer = 0;

    if (this.running) {
      this._spawnPiece();
      this._notifyState();
    }
  }

  _clearLines() {
    const remainingRows = this.board.filter((row) => row.some((cell) => !cell));
    const clearedCount = BOARD_ROWS - remainingRows.length;
    if (clearedCount === 0) return;

    const newRows = Array.from({ length: clearedCount }, () => new Array(BOARD_COLS).fill(null));
    this.board = [...newRows, ...remainingRows];

    const levelFactor = 1 + (this.level - 1) * 0.1;
    const baseScore = LINE_SCORES[clearedCount] || 0;
    this.score += Math.round(baseScore * levelFactor * this.scoreMultiplier);

    this.linesCleared += clearedCount;
    this.level = Math.floor(this.linesCleared / 10) + 1;
    this.fallSpeedMs = Math.max(this.initialFallSpeedMs - (this.level - 1) * 50, 100);
  }

  _loop(now) {
    if (!this.running) return;
    if (this.lastTime === null) this.lastTime = now;
    const delta = now - this.lastTime;
    this.lastTime = now;

    this.dropTimer += delta;
    if (this.dropTimer >= this.fallSpeedMs) {
      this.dropTimer = 0;
      if (!this._tryMove(0, 1)) {
        this._lockPiece();
      }
    }

    this._render();
    this.animationFrameId = requestAnimationFrame(this._loop);
  }

  _getGhostY() {
    let ghostY = this.currentY;
    while (this._isValidPosition(this.currentType, this.currentRotation, this.currentX, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  _render() {
    this._renderBoard();
    this._renderNext();
  }

  _renderBoard() {
    const ctx = this.boardCtx;
    ctx.clearRect(0, 0, BOARD_COLS * CELL_SIZE, BOARD_ROWS * CELL_SIZE);

    // 盤面に固定済みのブロックを描画
    for (let y = 0; y < BOARD_ROWS; y++) {
      for (let x = 0; x < BOARD_COLS; x++) {
        if (this.board[y][x]) {
          this._drawCell(ctx, x, y, this.board[y][x], CELL_SIZE);
        }
      }
    }

    // ゴースト（落下予定位置）を描画
    const ghostY = this._getGhostY();
    const ghostCells = getShapeCells(this.currentType, this.currentRotation);
    ctx.globalAlpha = 0.25;
    for (const cell of ghostCells) {
      this._drawCell(ctx, this.currentX + cell.x, ghostY + cell.y, TETROMINO_COLORS[this.currentType], CELL_SIZE);
    }
    ctx.globalAlpha = 1;

    // 現在操作中のミノを描画
    const currentCells = getShapeCells(this.currentType, this.currentRotation);
    for (const cell of currentCells) {
      this._drawCell(ctx, this.currentX + cell.x, this.currentY + cell.y, TETROMINO_COLORS[this.currentType], CELL_SIZE);
    }

    // グリッド線
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    for (let x = 0; x <= BOARD_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, BOARD_ROWS * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(BOARD_COLS * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }
  }

  _renderNext() {
    const ctx = this.nextCtx;
    const width = ctx.canvas.width;
    const slotHeight = ctx.canvas.height / NEXT_PREVIEW_COUNT;
    ctx.clearRect(0, 0, width, ctx.canvas.height);

    for (let i = 0; i < NEXT_PREVIEW_COUNT; i++) {
      const type = this.queue[i];
      if (!type) continue;
      const cells = getShapeCells(type, 0);
      const offsetY = i * slotHeight + (slotHeight - 4 * NEXT_CELL_SIZE) / 2;
      const offsetX = (width - 4 * NEXT_CELL_SIZE) / 2;
      for (const cell of cells) {
        ctx.fillStyle = TETROMINO_COLORS[type];
        ctx.fillRect(
          offsetX + cell.x * NEXT_CELL_SIZE,
          offsetY + cell.y * NEXT_CELL_SIZE,
          NEXT_CELL_SIZE - 1,
          NEXT_CELL_SIZE - 1
        );
      }
    }
  }

  _drawCell(ctx, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size - 1, size - 1);
  }
}
