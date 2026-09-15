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

    // 盤面がまだ空の最初の1個は、衝突判定・ゲームオーバー判定を経由せずに出現させる。
    this._spawnPiece(true);
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

  _spawnPiece(isInitial = false) {
    const type = this.queue.shift();
    this.currentType = type;
    this.currentRotation = 0;
    this.currentX = 3;
    this.currentY = 0;

    if (this.queue.length < 7) {
      this.onQueueLow();
    }

    if (!isInitial) {
      this._checkGameOver();
    }
  }

  /**
   * _spawnPieceが新しいミノを配置した直後に呼ばれるゲームオーバー判定。
   * 出現位置（this.currentType/currentRotation/currentX/currentY）にSTEP 3-4の
   * 衝突判定関数（_isValidPosition）がそのまま使えないか考えてみましょう。
   * 衝突していれば、ループとキーボードイベントリスナーを止め、
   * onGameOver({ score, level, lines })を呼び出してゲームオーバーとします。
   * 詳細設計書 S-04（リザルト画面）への切り替えはonGameOverの呼び出し先（screens.js）が行います。
   */
  _checkGameOver() {
    if (!this._isValidPosition(this.currentType, this.currentRotation, this.currentX, this.currentY)) {
      this.stop();
      this.onGameOver({
        score: this.score,
        level: this.level,
        lines: this.linesCleared,
      });
    }
  }

  

  /**
   * 指定した位置・回転状態でテトリミノ(type, rotation)を配置できるかを判定する。
   * 盤面外（列が0〜BOARD_COLS-1の範囲外、行がBOARD_ROWS以上）に出る場合はfalse。
   * 盤面より上（行が負）は衝突なしとして扱ってよい。
   * 既に固定されたブロックと重なる場合はfalseを返す。
   */
  _isValidPosition(type, rotation, posX, posY) {
    if (!TETROMINO_SHAPES[type]) throw new Error(`Invalid tetromino type: ${type}`);
    const cells = getShapeCells(type, rotation);
    for (const cell of cells) {
      const x = posX + cell.x;
      const y = posY + cell.y;
      if (x < 0 || x >= BOARD_COLS) return false;
      if (y >= BOARD_ROWS) return false;
      if (y >= 0 && this.board[y][x]) return false;
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

  /**
   * 現在のミノを(dx, dy)だけ移動できるか判定し、可能であれば
   * currentX/currentYを更新してtrueを返す。できない場合は何もせずfalseを返す。
   */
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


  /**
   * 現在のミノを時計回りに1状態(0→R→2→L→0)回転する。
   * 詳細設計書4章：壁蹴り（ウォールキック）は行わない簡易回転方式。
   * 回転後の位置が衝突する場合は回転をキャンセルする（回転前の状態を維持する）。
   */
  _tryRotate() {
    const newRotation = (this.currentRotation + 1) % 4;
    if (this._isValidPosition(this.currentType, newRotation, this.currentX, this.currentY)) {
      this.currentRotation = newRotation;
    } 
  }

  /**
   * 衝突するまで現在のミノを下に移動させ続けてから固定する。
  */

  _hardDrop() {
    while (this._tryMove(0, 1)) {}
    this._lockPiece();
  }

  

  /**
   * 一定間隔（fallSpeedMs）ごとに_loopから呼ばれる自然落下処理。
   * 現在のミノを1マス下に移動できるか試し（_tryMove(0, 1)）、
   * 移動できなければその場で固定する（_lockPiece）。
   * 落下間隔そのものはレベルによって変わる（詳細設計書5.3）が、
   * 間隔の管理自体は_loop側で行うので、ここでは「1回分の落下」だけを考えればよい。
   */
  _naturalFall() {
    if (!this._tryMove(0, 1)) {
      this._lockPiece();
    }
  }


  /**
   * 現在のミノを盤面に固定する（「これ以上下に移動できない」と判定されたときの処理）。
   * 今操作中のテトリミノが占めている4マスの色（TETROMINO_COLORS）を、
   * board配列に書き込む。そのうえで、ライン消去処理（_clearLines）を行い、
   * その戻り値（消去したライン数）を得点計算処理（_updateScore）に渡す。
   * 固定が終わったら次のミノをスポーンする（_spawnPiece）。
   * 出現位置にすでにブロックがある場合はゲームオーバーになる（STEP 3-9）。
   */
  _lockPiece () {
    const cells = getShapeCells(this.currentType, this.currentRotation);
    for (const cell of cells) {
      const x = this.currentX + cell.x;
      const y = this.currentY + cell.y;
      if (y >= 0 && y < BOARD_ROWS && x >= 0 && x < BOARD_COLS) {
        this.board[y][x] = TETROMINO_COLORS[this.currentType];
      }
    }
    const clearedCount = this._clearLines();
    this._updateScore(clearedCount);
    this._spawnPiece();
    this._notifyState();
  }
    
  /**
   * 揃った行（すべてのセルが埋まっている行）を盤面から取り除き、
   * それより上にあった行を1つずつ下にずらす（空いた上部には空行を詰める）。
   * 得点計算はここでは行わず、消去したライン数（0以上の整数）を返すだけにする。
   * 得点計算・レベルアップはSTEP 3-8の_updateScoreで行う。
   */
  _clearLines() {
    let count = 0;
    for (let y = BOARD_ROWS - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell !== null)) {
        this.board.splice(y, 1);
        count++;
        this.board.unshift(new Array(BOARD_COLS).fill(null));
        y++; // 上の行も再チェックするためにyを戻す
      }
    } 
    return count;
  }

  /**
   * _clearLinesが返した消去ライン数（clearedCount）を受け取り、得点を加算する。
   * clearedCountが0の場合は何もしない。
   * 詳細設計書「5.2 最終加算得点の計算式」：
   *   加算得点 = 基本得点（LINE_SCORES） × レベル係数(1 + (level-1)*0.1) × 難易度倍率
   * また、消去ライン数の累計（linesCleared）が10の倍数に達するごとにレベルを1上げ、
   * 落下速度を詳細設計書5.3の式 max(初期落下速度 - (level-1)*50, 100) で再計算する。
   */
  _updateScore(clearedCount) {
    if (clearedCount === 0) return;
    const baseScore = LINE_SCORES[clearedCount] || 0;
    const levelMultiplier = 1 + (this.level - 1) * 0.1;
    const addedScore = Math.floor(baseScore * levelMultiplier * this.scoreMultiplier);
    this.score += addedScore;
    this.linesCleared += clearedCount;
    const newLevel = Math.floor(this.linesCleared / 10) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.fallSpeedMs = Math.max(this.initialFallSpeedMs - (this.level - 1) * 50, 100);
    }
  }

  _loop(now) {
    if (!this.running) return;
    if (this.lastTime === null) this.lastTime = now;
    const delta = now - this.lastTime;
    this.lastTime = now;

    this.dropTimer += delta;
    if (this.dropTimer >= this.fallSpeedMs) {
      this.dropTimer = 0;
      this._naturalFall();
    }

    this._render();
    this.animationFrameId = requestAnimationFrame(this._loop);
  }

  /**
   * 現在のミノをそのまま落下させた場合に着地するY座標を返す（ゴースト表示用）。
   * 現在の位置から1マスずつ下に動かしながら、STEP 3-4の衝突判定（_isValidPosition）で
   * 「まだ置けるか」を繰り返し確認し、衝突する1つ手前の位置を返す。
   * 実装したら、_renderBoardの中でこの値を使い、通常のミノとは異なる薄い色
   * （ctx.globalAlphaなど）でゴーストを描画する処理も追加すること。
   */
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

  /**
   * 盤面（固定済みブロック）と、現在操作中のテトリミノを描画する。
   * 1. this.boardCtx.clearRectでキャンバス全体をクリアする
   * 2. this.boardを2重ループし、埋まっているマス（board[y][x]に色が入っているマス）を
   *    _drawCellで描画する
   * 3. 現在操作中のミノ（getShapeCells(this.currentType, this.currentRotation)）を、
   *    this.currentX/this.currentYを基準にTETROMINO_COLORSの色で描画する
   * ゴースト（STEP 3-10）やグリッド線の描画は、この関数の中に追加していけばよい。
   */
_renderBoard() {
  const ctx = this.boardCtx;
  ctx.clearRect(0, 0, BOARD_COLS * CELL_SIZE, BOARD_ROWS * CELL_SIZE);

  // 1. 盤面に固定済みのブロックを描画
  for (let y = 0; y < BOARD_ROWS; y++) {
    for (let x = 0; x < BOARD_COLS; x++) {
      if (this.board[y][x]) {
        this._drawCell(ctx, x, y, this.board[y][x], CELL_SIZE);
      }
    }
  }

  // 1.5 ゴーストの描画
  const ghostY = this._getGhostY();
  const ghostCells = getShapeCells(this.currentType, this.currentRotation);
  ctx.globalAlpha = 0.3; // ゴーストの透明度を設定
  for (const cell of ghostCells) {
    this._drawCell(
      ctx,
      this.currentX + cell.x,
      ghostY + cell.y,
      TETROMINO_COLORS[this.currentType],
      CELL_SIZE
    );
  }
  ctx.globalAlpha = 1.0; // 元の透明度に戻す
  


   // 2. 現在操作中のミノを描画
  const cells = getShapeCells(this.currentType, this.currentRotation);
  for (const cell of cells) {
    this._drawCell(
      ctx,
      this.currentX + cell.x,
      this.currentY + cell.y,
      TETROMINO_COLORS[this.currentType],
      CELL_SIZE
    );
  }
}


  /**
   * ネクスト（次に出現する）テトリミノのプレビューをnextCanvas（this.nextCtx）に描画する。
   * this.queueの先頭からNEXT_PREVIEW_COUNT個を取り出し、
   * getShapeCells(type, 0)の座標をNEXT_CELL_SIZE単位で並べて描画する。
   */
  _renderNext() {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, NEXT_CELL_SIZE * 4, NEXT_CELL_SIZE * NEXT_PREVIEW_COUNT);

    for (let i = 0; i < NEXT_PREVIEW_COUNT; i++) {
      const type = this.queue[i];
      const cells = getShapeCells(type, 0);
      for (const cell of cells) {
        this._drawCell(ctx, cell.x, i * 4 + cell.y, TETROMINO_COLORS[type], NEXT_CELL_SIZE);
      }
    }
  }




  /**
   * 1マス分の矩形をCanvasに描画する共通ヘルパー。
   * 列番号x・行番号yに対して、(x*size, y*size)を左上として、
   * 幅・高さ(size-1)の矩形をcolorで塗りつぶす（マス間に1pxの隙間を作るため-1している）。
   */
  _drawCell(ctx, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size - 1, size - 1);
  }
}

