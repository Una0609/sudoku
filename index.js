// ============================
// 一、遊戲資料
// ============================

let puzzle = [];
let solution = [];
let original = [];

let selected = -1;
let seconds = 0;
let timer = null;
let finished = false;

let hintCount = 0;
let gameDifficulty = "中等";
let completedAt = "";

// ============================
// 二、取得 HTML 元素
// ============================

const board = document.getElementById("board");
const message = document.getElementById("message");

// ============================
// 三、檢查合法數字
// ============================

function candidates(grid, r, c) {

    let used = new Set();

    for (let i = 0; i < 9; i++) {
        used.add(grid[r][i]);
        used.add(grid[i][c]);
    }

    let br = Math.floor(r / 3) * 3;
    let bc = Math.floor(c / 3) * 3;

    for (let i = br; i < br + 3; i++) {
        for (let j = bc; j < bc + 3; j++) {
            used.add(grid[i][j]);
        }
    }

    return [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .filter(n => !used.has(n));
}

// ============================
// 四、尋找候選數最少的空格
// ============================

function findBest(grid) {

    let best = null;
    let min = 10;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {

            if (grid[r][c] === 0) {

                let options = candidates(grid, r, c);

                if (options.length < min) {
                    min = options.length;
                    best = { r, c, options };
                }

                if (min === 0) return best;
            }
        }
    }

    return best;
}

// ============================
// 五、回溯法產生完整答案
// ============================

function fillGrid(grid) {

    let spot = findBest(grid);

    if (!spot) return true;

    let { r, c, options } = spot;

    options.sort(() => Math.random() - 0.5);

    for (let n of options) {

        grid[r][c] = n;

        if (fillGrid(grid)) return true;

        grid[r][c] = 0;
    }

    return false;
}

// ============================
// 六、計算解答數量
// ============================

function countSolutions(grid, limit = 2) {

    let spot = findBest(grid);

    if (!spot) return 1;

    if (spot.options.length === 0) return 0;

    let count = 0;
    let { r, c, options } = spot;

    for (let n of options) {

        grid[r][c] = n;

        count += countSolutions(grid, limit - count);

        grid[r][c] = 0;

        if (count >= limit) return count;
    }

    return count;
}

// ============================
// 七、產生新題目
// ============================

function generatePuzzle() {

    clearInterval(timer);

    document.getElementById("resultModal")
        .classList.remove("show");

    seconds = 0;
    hintCount = 0;
    finished = false;
    selected = -1;

    updateTimer();

    message.textContent = "正在產生題目...";

    solution = Array.from(
        { length: 9 },
        () => Array(9).fill(0)
    );

    fillGrid(solution);

    puzzle = solution.map(row => [...row]);

    let positions = Array.from(
        { length: 81 },
        (_, i) => i
    );

    positions.sort(() => Math.random() - 0.5);

    let target = Number(
        document.getElementById("difficulty").value
    );

    gameDifficulty = {
        40: "簡單",
        30: "中等",
        20: "困難"
    }[target];

    let clues = 81;

    for (let pos of positions) {

        if (clues <= target) break;

        let r = Math.floor(pos / 9);
        let c = pos % 9;

        let old = puzzle[r][c];

        puzzle[r][c] = 0;

        let copy = puzzle.map(row => [...row]);

        if (countSolutions(copy) !== 1) {
            puzzle[r][c] = old;
        } else {
            clues--;
        }
    }

    original = puzzle.map(row => [...row]);

    renderBoard();
    startTimer();

    message.textContent = "新題目已完成！祝你解題愉快。";
}

// ============================
// 八、繪製棋盤
// ============================

function renderBoard() {

    board.innerHTML = "";

    for (let r = 0; r < 9; r++) {

        for (let c = 0; c < 9; c++) {

            let i = r * 9 + c;
            let cell = document.createElement("div");

            cell.className = "cell";
            cell.textContent = puzzle[r][c] || "";

            if (original[r][c] !== 0) {
                cell.classList.add("fixed");
            }

            if (selected === i) {
                cell.classList.add("selected");
            }

            else if (selected !== -1) {

                let sr = Math.floor(selected / 9);
                let sc = selected % 9;

                if (
                    r === sr ||
                    c === sc ||
                    (
                        Math.floor(r / 3) === Math.floor(sr / 3) &&
                        Math.floor(c / 3) === Math.floor(sc / 3)
                    )
                ) {
                    cell.classList.add("related");
                }

                if (
                    puzzle[r][c] !== 0 &&
                    puzzle[r][c] === puzzle[sr][sc]
                ) {
                    cell.classList.add("same");
                }
            }

            if (
                puzzle[r][c] !== 0 &&
                original[r][c] === 0 &&
                puzzle[r][c] !== solution[r][c]
            ) {
                cell.classList.add("error");
            }

            cell.addEventListener("click", () => {
                if (finished) return;

                selected = i;
                renderBoard();
            });

            board.appendChild(cell);
        }
    }
}

// ============================
// 九、建立數字按鈕
// ============================

function createNumbers() {

    let numbers = document.getElementById("numbers");

    for (let n = 1; n <= 9; n++) {

        let btn = document.createElement("button");

        btn.textContent = n;

        btn.addEventListener("click", () => {
            enterNumber(n);
        });

        numbers.appendChild(btn);
    }
}

// ============================
// 十、輸入數字
// ============================

function enterNumber(n) {

    if (selected === -1 || finished) return;

    let r = Math.floor(selected / 9);
    let c = selected % 9;

    if (original[r][c] !== 0) return;

    puzzle[r][c] = n;

    renderBoard();

    checkComplete();
}

// ============================
// 十一、檢查是否完成
// ============================

function checkComplete() {

    let complete = puzzle.every((row, r) =>
        row.every((n, c) => n === solution[r][c])
    );

    if (complete) {
        finishGame();
    }
}

// ============================
// 十二、完成遊戲及結算
// ============================

function finishGame() {

    if (finished) return;

    finished = true;

    clearInterval(timer);

    completedAt = new Date().toLocaleString("zh-TW", {
        hour12: false
    });

    document.getElementById("resultTime").textContent =
        formatTime(seconds);

    document.getElementById("resultDifficulty").textContent =
        gameDifficulty;

    document.getElementById("resultHint").textContent =
        hintCount > 0 ? "有使用" : "沒有使用";

    document.getElementById("resultHintCount").textContent =
        hintCount + " 次";

    document.getElementById("resultDate").textContent =
        completedAt;

    document.getElementById("resultModal")
        .classList.add("show");

    message.textContent = "恭喜完成數獨！";
}

// ============================
// 十三、檢查答案
// ============================

function checkAnswer() {

    let wrong = 0;
    let empty = 0;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {

            if (puzzle[r][c] === 0) {
                empty++;
            }

            else if (puzzle[r][c] !== solution[r][c]) {
                wrong++;
            }
        }
    }

    renderBoard();

    if (wrong > 0) {
        message.textContent =
            `目前有 ${wrong} 個錯誤，繼續加油！`;
    }

    else if (empty > 0) {
        message.textContent =
            `目前填寫正確，還有 ${empty} 格未完成！`;
    }

    else {
        checkComplete();
    }
}

// ============================
// 十四、提示功能
// ============================

function giveHint() {

    if (finished) return;

    let empty = [];

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {

            if (puzzle[r][c] === 0) {
                empty.push({ r, c });
            }
        }
    }

    if (empty.length === 0) return;

    let spot = empty[
        Math.floor(Math.random() * empty.length)
    ];

    puzzle[spot.r][spot.c] =
        solution[spot.r][spot.c];

    hintCount++;

    selected = spot.r * 9 + spot.c;

    renderBoard();

    checkComplete();

    if (!finished) {
        message.textContent =
            `已使用 ${hintCount} 次提示！`;
    }
}

// ============================
// 十五、顯示答案
// ============================

function showSolution() {

    if (finished) return;

    puzzle = solution.map(row => [...row]);

    finished = true;

    clearInterval(timer);

    renderBoard();

    message.textContent = "已顯示完整答案。";
}

// ============================
// 十六、重新開始
// ============================

function restartGame() {

    puzzle = original.map(row => [...row]);

    selected = -1;
    finished = false;
    hintCount = 0;
    seconds = 0;

    document.getElementById("resultModal")
        .classList.remove("show");

    updateTimer();
    startTimer();
    renderBoard();

    message.textContent = "已重新開始！";
}

// ============================
// 十七、時間格式
// ============================

function formatTime(total) {

    let min = Math.floor(total / 60);
    let sec = total % 60;

    return String(min).padStart(2, "0") + ":" +
        String(sec).padStart(2, "0");
}

function updateTimer() {
    document.getElementById("timer").textContent =
        formatTime(seconds);
}

function startTimer() {

    clearInterval(timer);

    timer = setInterval(() => {

        if (!finished) {
            seconds++;
            updateTimer();
        }

    }, 1000);
}

// ============================
// 十八、下載題目
// ============================

function downloadPuzzle() {

    // 建立畫布
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1400;

    const ctx = canvas.getContext("2d");

    // 白色背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 標題
    ctx.fillStyle = "#547966";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 65px Arial, sans-serif";
    ctx.fillText("SUDOKU", 600, 115);

    // 中文副標題與難度
    ctx.fillStyle = "#555555";
    ctx.font = "32px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText("數獨挑戰", 600, 185);
    ctx.fillText("難度：" + gameDifficulty, 600, 260);

    // 棋盤設定
    const startX = 150;
    const startY = 350;
    const size = 900;
    const cell = size / 9;

    // 先畫格線
    for (let i = 0; i <= 9; i++) {
        ctx.beginPath();
        ctx.lineWidth = i % 3 === 0 ? 7 : 2;
        ctx.strokeStyle = "#35443d";

        ctx.moveTo(startX + i * cell, startY);
        ctx.lineTo(startX + i * cell, startY + size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(startX, startY + i * cell);
        ctx.lineTo(startX + size, startY + i * cell);
        ctx.stroke();
    }

    // 繪製題目數字
    ctx.fillStyle = "#35443d";
    ctx.font = "bold 43px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const n = original[r][c];

            if (n !== 0) {
                ctx.fillText(
                    String(n),
                    startX + c * cell + cell / 2,
                    startY + r * cell + cell / 2
                );
            }
        }
    }

    // 姓名與日期欄位
    ctx.fillStyle = "#555555";
    ctx.font = "30px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("姓名：________________", 150, 1320);
    ctx.fillText("日期：________________", 650, 1320);

    // 轉成 JPG 並下載
    canvas.toBlob(function (blob) {
        if (!blob) {
            message.textContent = "圖片產生失敗，請再試一次。";
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "數獨題目.jpg";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/jpeg", 0.95);
}

// ============================
// 十九、下載結算紀錄
// ============================

// 十九、下載結算紀錄
// ============================

function downloadResult() {

    let record = `
        ===== 數獨遊戲結算紀錄 =====

        完成日期：${completedAt}

        遊戲難度：${gameDifficulty}

        解題時間：${formatTime(seconds)}

        是否使用提示：${hintCount > 0 ? "有" : "沒有"}

        提示使用次數：${hintCount} 次

        完成狀態：成功完成

============================
感謝遊玩！
`;

    downloadFile(
        record,
        "數獨遊戲成績紀錄.txt",
        "text/plain;charset=utf-8"
    );
}

// ============================
// 二十、共用下載功能
// ============================

function downloadFile(content, filename, type) {

    let blob = new Blob(
        ["\uFEFF", content],
        { type }
    );

    let url = URL.createObjectURL(blob);

    let link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================
// 二十一、事件綁定
// ============================

document.getElementById("newGame")
    .addEventListener("click", generatePuzzle);

document.getElementById("restart")
    .addEventListener("click", restartGame);

document.getElementById("check")
    .addEventListener("click", checkAnswer);

document.getElementById("hint")
    .addEventListener("click", giveHint);

document.getElementById("solution")
    .addEventListener("click", showSolution);

document.getElementById("downloadPuzzle")
    .addEventListener("click", downloadPuzzle);

document.getElementById("downloadResult")
    .addEventListener("click", downloadResult);

document.getElementById("playAgain")
    .addEventListener("click", generatePuzzle);

// ============================
// 二十二、初始化
// ============================

createNumbers();
generatePuzzle();