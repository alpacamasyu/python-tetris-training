// 画面遷移・DOMイベント・API呼び出しの連携を担当する。

const screens = {
  login: document.getElementById("screen-login"),
  menu: document.getElementById("screen-menu"),
  game: document.getElementById("screen-game"),
  result: document.getElementById("screen-result"),
  ranking: document.getElementById("screen-ranking"),
  history: document.getElementById("screen-history"),
};

const state = {
  user: null,
  difficultySettings: [],
  selectedDifficulty: null,
  game: null,
  lastResult: null,
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function setError(elementId, message) {
  document.getElementById(elementId).textContent = message || "";
}

// --- S-01 ログイン画面 ---

async function handleLogin() {
  const nicknameInput = document.getElementById("nickname-input");
  const nickname = nicknameInput.value.trim();
  setError("login-error", "");

  if (!nickname) {
    setError("login-error", "ニックネームを入力してください");
    return;
  }

  try {
    const user = await api.login(nickname);
    state.user = user;
    await enterMenuScreen();
  } catch (err) {
    if (err.status === 404) {
      try {
        const user = await api.registerUser(nickname);
        state.user = user;
        await enterMenuScreen();
      } catch (registerErr) {
        setError("login-error", registerErr.message);
      }
    } else {
      setError("login-error", err.message);
    }
  }
}

// --- S-02 メニュー画面 ---

async function enterMenuScreen() {
  document.getElementById("menu-nickname").textContent = state.user.nickname;
  setError("menu-error", "");

  if (state.difficultySettings.length === 0) {
    try {
      state.difficultySettings = await api.getDifficultySettings();
    } catch (err) {
      setError("menu-error", err.message);
    }
  }
  renderDifficultyOptions();
  showScreen("menu");
}

function renderDifficultyOptions() {
  const container = document.getElementById("difficulty-list");
  container.innerHTML = "";
  state.difficultySettings.forEach((difficulty, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "difficulty-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "difficulty";
    input.id = `difficulty-${difficulty.name}`;
    input.value = difficulty.name;
    if (index === 0) input.checked = true;

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = difficulty.name;

    wrapper.appendChild(input);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  });
}

function getSelectedDifficulty() {
  const checked = document.querySelector('input[name="difficulty"]:checked');
  if (!checked) return null;
  return state.difficultySettings.find((d) => d.name === checked.value) || null;
}

async function handleStartGame() {
  const difficulty = getSelectedDifficulty();
  if (!difficulty) {
    setError("menu-error", "難易度を選択してください");
    return;
  }
  state.selectedDifficulty = difficulty;
  setError("menu-error", "");
  await enterGameScreen();
}

async function handleShowRanking() {
  showScreen("ranking");
  const tbody = document.querySelector("#ranking-table tbody");
  tbody.innerHTML = "";
  try {
    const rankings = await api.getRankings(10);
    rankings.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.rank}</td>
        <td>${row.nickname}</td>
        <td>${row.score}</td>
        <td>${row.difficulty}</td>
        <td>${formatDateTime(row.played_at)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    setError("menu-error", err.message);
  }
}

async function handleShowHistory() {
  showScreen("history");
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";
  try {
    const history = await api.getHistory(state.user.user_id, 20);
    history.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.score}</td>
        <td>${row.level_reached}</td>
        <td>${row.lines_cleared}</td>
        <td>${row.difficulty}</td>
        <td>${formatDateTime(row.played_at)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    setError("menu-error", err.message);
  }
}

// --- S-03 ゲームプレイ画面 ---

async function enterGameScreen() {
  document.getElementById("game-difficulty").textContent = state.selectedDifficulty.name;
  document.getElementById("game-score").textContent = "0";
  document.getElementById("game-level").textContent = "1";
  document.getElementById("game-lines").textContent = "0";
  showScreen("game");

  const boardCanvas = document.getElementById("board-canvas");
  const nextCanvas = document.getElementById("next-canvas");

  if (!state.game) {
    state.game = new TetrisGame({
      boardCanvas,
      nextCanvas,
      onStateChange: (gameState) => {
        document.getElementById("game-score").textContent = gameState.score;
        document.getElementById("game-level").textContent = gameState.level;
        document.getElementById("game-lines").textContent = gameState.lines;
      },
      onGameOver: (result) => {
        state.lastResult = result;
        enterResultScreen();
      },
      onQueueLow: async () => {
        try {
          const { sequence } = await api.getTetrominoSequence(1);
          state.game.enqueue(sequence);
        } catch (err) {
          // ネクストキュー補充に失敗してもゲームを止めない
          console.error(err);
        }
      },
    });
  }

  try {
    const { sequence } = await api.getTetrominoSequence(2);
    state.game.start(state.selectedDifficulty, sequence);
  } catch (err) {
    setError("menu-error", err.message);
    showScreen("menu");
  }
}

// --- S-04 リザルト画面 ---

function enterResultScreen() {
  document.getElementById("result-score").textContent = state.lastResult.score;
  document.getElementById("result-level").textContent = state.lastResult.level;
  document.getElementById("result-lines").textContent = state.lastResult.lines;
  setError("result-error", "");
  showScreen("result");
}

async function handleRegisterScore() {
  try {
    await api.registerScore({
      userId: state.user.user_id,
      score: state.lastResult.score,
      levelReached: state.lastResult.level,
      linesCleared: state.lastResult.lines,
      difficulty: state.selectedDifficulty.name,
    });
    await enterMenuScreen();
  } catch (err) {
    setError("result-error", err.message);
  }
}

// --- イベント登録 ---

document.getElementById("login-button").addEventListener("click", handleLogin);
document.getElementById("nickname-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});
document.getElementById("start-game-button").addEventListener("click", handleStartGame);
document.getElementById("show-ranking-button").addEventListener("click", handleShowRanking);
document.getElementById("show-history-button").addEventListener("click", handleShowHistory);
document.getElementById("register-score-button").addEventListener("click", handleRegisterScore);
document.getElementById("ranking-back-button").addEventListener("click", () => showScreen("menu"));
document.getElementById("history-back-button").addEventListener("click", () => showScreen("menu"));
