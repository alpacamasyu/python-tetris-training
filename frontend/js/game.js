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

  /**
   * ゲームを初期化して開始する。
   * - difficultySetting（A-04のレスポンス1件）から初期落下速度・得点倍率を保持する
   * - 盤面（BOARD_ROWS x BOARD_COLS、すべてnull）・スコア・レベル・消去ライン数を初期化する
   * - initialQueue（テトリミノ出現順序の配列）をキューとして保持する
   * - 最初のミノをスポーンし、onStateChangeで初期状態を通知する
   * - キーボードイベントを登録し、ゲームループ（requestAnimationFrame）を開始する
   * 詳細設計書 S-03 初期化処理。
   */
  start(difficultySetting, initialQueue) {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  }

  /**
   * ゲームループを停止し、キーボードイベントリスナーを解除する。
   */
  stop() {
    // TODO: ここに実装する
    throw new Error("Not implemented");
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

  /**
   * キューの先頭からテトリミノを1つ取り出し、盤面上部中央（x=3, y=0）に配置する。
   * キューの残数が7未満になったらonQueueLow()を呼び、ネクストキューの補充を促す。
   * 配置しようとした位置が既存ブロックと衝突する場合はゲームオーバーと判定し、
   * ループとイベントリスナーを止めてonGameOver({ score, level, lines })を呼ぶ。
   * 詳細設計書 S-03 終了処理。
   */
  _spawnPiece() {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  }

  /**
   * 指定した位置・回転状態でテトリミノ(type, rotation)を配置できるかを判定する。
   * 盤面外（列が0〜BOARD_COLS-1の範囲外、行がBOARD_ROWS以上）に出る場合はfalse。
   * 盤面より上（行が負）は衝突なしとして扱ってよい。
   * 既に固定されたブロックと重なる場合はfalseを返す。
   */
  _isValidPosition(type, rotation, posX, posY) {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  }

  /**
   * キー入力に応じて操作を行う。詳細設計書 S-03 操作仕様。
   * ArrowLeft/ArrowRight: 左右移動 / ArrowUp: 回転 / ArrowDown: ソフトドロップ
   * （移動できない場合はその場で固定する）/ Space（" "）: ハードドロップ
   */
  _handleKeydown(e) {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  }

  /**
   * 現在のミノを(dx, dy)だけ移動できるか判定し、可能であれば
   * currentX/currentYを更新してtrueを返す。できない場合は何もせずfalseを返す。
   */
  _tryMove(dx, dy) {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  }

  /**
   * 現在のミノを時計回りに1状態(0→R→2→L→0)回転する。
   * 詳細設計書4章：壁蹴り（ウォールキック）は行わない簡易回転方式。
   * 回転後の位置が衝突する場合は回転をキャンセルする（回転前の状態を維持する）。
   */
  _tryRotate() {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  }

  /**
   * 衝突するまで現在のミノを下に移動させ続けてから固定する。
   */
  _hardDrop() {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  }

  /**
   * 現在のミノを盤面に固定し（board配列にTETROMINO_COLORSの色を書き込む）、
   * ライン消去判定（_clearLines）を行った上で、次のミノをスポーンする。
   */
  _lockPiece() {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  }

  /**
   * 揃った行（すべてのセルが埋まっている行）を盤面から取り除き、上に空行を詰める。
   * 詳細設計書5章 得点計算仕様に従い、消去したライン数に応じて得点を加算する。
   *   加算得点 = 基本得点（LINE_SCORES） × レベル係数(1 + (level-1)*0.1) × 難易度倍率
   * 消去ライン数の累計が10の倍数に達するごとにレベルを1上げ、
   * 落下速度を max(初期落下速度 - (level-1)*50, 100) で再計算する。
   */
  _clearLines() {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  }

  /**
   * requestAnimationFrameで毎フレーム呼ばれるゲームループ。
   * 前回フレームからの経過時間をdropTimerに積算し、fallSpeedMsを超えたら
   * 自然落下（下に1マス移動、できなければ固定）を行う。
   * 最後に描画（_render）を行い、次のフレームを予約する。
   */
  _loop(now) {
    // TODO: ここに実装する
    throw new Error("Not implemented");
  }

  /**
   * 現在のミノをそのまま落下させた場合に着地するY座標（ゴースト表示用）を返す。
   */
  _getGhostY() {
    // TODO: ここに実装する
    throw new Error("Not implemented");
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
