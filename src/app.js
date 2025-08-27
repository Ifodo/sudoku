/* global SudokuEngine, SudokuStorage */

const getHintsForDifficulty = (difficulty) => {
	switch (difficulty) {
		case "easy":
			return 50;
		case "medium":
			return 5;
		case "hard":
			return 3;
		default:
			return 50;
	}
};

const state = {
	givenBoard: null, // cells that are fixed (non-editable)
	puzzleBoard: null, // current working board (with user inputs)
	solvedBoard: null,
	selected: null, // [row, col]
	secondsElapsed: 0,
	isPaused: false,
	showErrors: true,
	hintsLeft: getHintsForDifficulty("easy"),
	puzzleId: null,
	difficulty: "easy",
};

const boardEl = document.getElementById("board");
const timerEl = document.getElementById("timer");
const hintBtn = document.getElementById("hint");
const errorToggle = document.getElementById("error-toggle");
const pauseBtn = document.getElementById("pause");
const newGameBtn = document.getElementById("new-game");
const difficultySelect = document.getElementById("difficulty");
const overlayEl = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayBody = document.getElementById("overlay-body");
const overlayClose = document.getElementById("overlay-close");
const overlayCta = document.getElementById("overlay-cta");
const fastWin = document.getElementById("fast-win");
const fwName = document.getElementById("fw-name");
const fwContact = document.getElementById("fw-contact");
const fwSend = document.getElementById("fw-send");

const setOverlay = (title, body, visible) => {
	overlayTitle.textContent = title;
	overlayBody.textContent = body;
	if (visible) {
		overlayEl.classList.remove("hidden");
		overlayEl.classList.add("flex");
	} else {
		overlayEl.classList.add("hidden");
		overlayEl.classList.remove("flex");
	}
};

const isBoard = (b) => Array.isArray(b) && b.length === 9 && b.every((row) => Array.isArray(row) && row.length === 9 && row.every((n) => Number.isInteger(n)));

const isValidSavedState = (s) => s && isBoard(s.givenBoard) && isBoard(s.puzzleBoard) && isBoard(s.solvedBoard);

document.getElementById("year").textContent = new Date().getFullYear();

let timerHandle = null;

const startTimer = () => {
	if (timerHandle) return;
	timerHandle = setInterval(() => {
		if (state.isPaused) return;
		state.secondsElapsed += 1;
		updateTimerUI();
		autosave();
	}, 1000);
};

const stopTimer = () => {
	if (!timerHandle) return;
	clearInterval(timerHandle);
	timerHandle = null;
};

const updateTimerUI = () => {
	timerEl.textContent = SudokuEngine.formatTime(state.secondsElapsed);
};

const autosave = () => {
	SudokuStorage.saveState({
		givenBoard: state.givenBoard,
		puzzleBoard: state.puzzleBoard,
		solvedBoard: state.solvedBoard,
		secondsElapsed: state.secondsElapsed,
		isPaused: state.isPaused,
		showErrors: state.showErrors,
		hintsLeft: state.hintsLeft,
		puzzleId: state.puzzleId,
		difficulty: state.difficulty,
	});
	SudokuStorage.savePrefs({ showErrors: state.showErrors, difficulty: state.difficulty });
};

const restore = () => {
	const saved = SudokuStorage.loadState();
	const prefs = SudokuStorage.loadPrefs();
	if (prefs && typeof prefs.showErrors === "boolean") errorToggle.checked = prefs.showErrors;
	if (prefs && typeof prefs.difficulty === "string") difficultySelect.value = prefs.difficulty;

	if (!isValidSavedState(saved)) return false;
	Object.assign(state, saved);
	state.isPaused = false;
	applyUIFromState();
	startTimer();
	return true;
};

const applyUIFromState = () => {
	updateTimerUI();
	updateHintUI();
	errorToggle.checked = state.showErrors;
	difficultySelect.value = state.difficulty;
	renderBoard();
};

const updateHintUI = () => {
	hintBtn.textContent = `Hint (${state.hintsLeft})`;
	hintBtn.disabled = state.hintsLeft <= 0;
	hintBtn.classList.toggle("opacity-50", state.hintsLeft <= 0);
};

const renderBoard = () => {
	boardEl.innerHTML = "";
	const grid = document.createElement("div");
	grid.setAttribute("role", "grid");
	grid.setAttribute("aria-label", "Sudoku grid");
	grid.className = "grid grid-cols-9 gap-px bg-gray-300 select-none";

	for (let r = 0; r < 9; r += 1) {
		for (let c = 0; c < 9; c += 1) {
			const isGiven = state.givenBoard[r][c] !== 0;
			const val = state.puzzleBoard[r][c];
			const btn = document.createElement("button");
			btn.type = "button";
			btn.setAttribute("role", "gridcell");
			btn.setAttribute("aria-label", `Row ${r + 1} Column ${c + 1}`);
			btn.dataset.row = r;
			btn.dataset.col = c;
			btn.className = [
				"h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-white text-lg font-semibold focus:outline-none",
				isGiven ? "text-gray-900" : "text-[#025940]",
				(r % 3 === 0) ? "border-t-2 border-gray-600" : "",
				(c % 3 === 0) ? "border-l-2 border-gray-600" : "",
				(r % 3 === 2) ? "border-b-2 border-gray-600" : "",
				(c % 3 === 2) ? "border-r-2 border-gray-600" : "",
				"hover:bg-gray-50",
			].filter(Boolean).join(" ");
			btn.textContent = val === 0 ? "" : String(val);
			btn.disabled = isGiven;
			btn.addEventListener("click", () => selectCell(r, c));
			btn.addEventListener("keydown", handleCellKeyDown);
			grid.appendChild(btn);
		}
	}
	boardEl.appendChild(grid);
	if (state.selected) {
		highlightSelection();
		focusSelectedCell();
	}
};

const selectCell = (row, col) => {
	state.selected = [row, col];
	highlightSelection();
	focusSelectedCell();
};

const focusSelectedCell = () => {
	if (!state.selected) return;
	const [sr, sc] = state.selected;
	const el = boardEl.querySelector(`[data-row='${sr}'][data-col='${sc}']`);
	if (el) el.focus();
};

const highlightSelection = () => {
	const [sr, sc] = state.selected || [];
	const cells = boardEl.querySelectorAll("[role='gridcell']");
	cells.forEach((cell) => {
		const r = Number(cell.dataset.row);
		const c = Number(cell.dataset.col);
		cell.classList.toggle("bg-[#e8f3ee]", state.selected && (r === sr || c === sc || (Math.floor(r/3) === Math.floor(sr/3) && Math.floor(c/3) === Math.floor(sc/3))));
	});
};

const placeNumber = (num) => {
	if (!state.selected) return;
	const [r, c] = state.selected;
	if (state.givenBoard[r][c] !== 0) return;
	if (num === 0) {
		state.puzzleBoard[r][c] = 0;
	} else {
		let safe = true;
		if (state.showErrors) {
			const prev = state.puzzleBoard[r][c];
			state.puzzleBoard[r][c] = 0;
			safe = SudokuEngine.isSafe(state.puzzleBoard, r, c, num);
			state.puzzleBoard[r][c] = prev;
		}
		if (!safe) {
			flashCellError(r, c);
			return;
		}
		state.puzzleBoard[r][c] = num;
	}
	renderBoard();
	autosave();
	checkCompletion();
};

const flashCellError = (row, col) => {
	const cell = boardEl.querySelector(`[data-row='${row}'][data-col='${col}']`);
	if (!cell) return;
	cell.classList.add("bg-red-100");
	setTimeout(() => cell.classList.remove("bg-red-100"), 300);
};

const handleCellKeyDown = (e) => {
	const r = Number(e.currentTarget.dataset.row);
	const c = Number(e.currentTarget.dataset.col);
	if (e.key >= "1" && e.key <= "9") {
		placeNumber(Number(e.key));
	} else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
		placeNumber(0);
	} else if (e.key === "ArrowUp" && r > 0) {
		selectCell(r - 1, c);
	} else if (e.key === "ArrowDown" && r < 8) {
		selectCell(r + 1, c);
	} else if (e.key === "ArrowLeft" && c > 0) {
		selectCell(r, c - 1);
	} else if (e.key === "ArrowRight" && c < 8) {
		selectCell(r, c + 1);
	}
};

// Number pad
Array.from(document.querySelectorAll(".num-key")).forEach((btn) => {
	btn.addEventListener("click", () => {
		const key = btn.dataset.key;
		if (key === "erase") return placeNumber(0);
		placeNumber(Number(key));
	});
});

hintBtn.addEventListener("click", () => {
	if (state.hintsLeft <= 0) return;
	const empty = SudokuEngine.findEmpty(state.puzzleBoard);
	if (!empty) return;
	const [r, c] = empty;
	state.puzzleBoard[r][c] = state.solvedBoard[r][c];
	state.hintsLeft -= 1;
	updateHintUI();
	renderBoard();
	autosave();
	checkCompletion();
});

errorToggle.addEventListener("change", () => {
	state.showErrors = errorToggle.checked;
	autosave();
});

pauseBtn.addEventListener("click", () => {
	state.isPaused = !state.isPaused;
	pauseBtn.textContent = state.isPaused ? "Resume" : "Pause";
});

newGameBtn.addEventListener("click", () => newGame());

difficultySelect.addEventListener("change", () => {
	state.difficulty = difficultySelect.value;
	autosave();
});

const newGame = () => {
	setOverlay("Generating puzzle…", "Please wait", true);
	if (overlayCta) overlayCta.classList.add("hidden");
	if (fastWin) fastWin.classList.add("hidden");
	setTimeout(() => {
		try {
			const solved = SudokuEngine.generateSolvedBoard();
			const puzzle = SudokuEngine.makePuzzle(solved, state.difficulty);
			state.solvedBoard = solved;
			state.givenBoard = puzzle.map((row) => row.slice());
			state.puzzleBoard = puzzle.map((row) => row.slice());
			state.hintsLeft = getHintsForDifficulty(state.difficulty);
			state.secondsElapsed = 0;
			state.isPaused = false;
			state.selected = null;
			state.puzzleId = `${Date.now()}`;
			applyUIFromState();
			startTimer();
			setOverlay("", "", false);
			autosave();
		} catch (err) {
			console.error("Puzzle generation failed", err);
			setOverlay("Generation failed", "Please try again, switch to Easy, or refresh.", true);
		}
	}, 10);
};

const checkCompletion = () => {
	if (!SudokuEngine.isCompleteAndValid(state.puzzleBoard)) return;
	setOverlay("Congratulations!", `You solved it in ${SudokuEngine.formatTime(state.secondsElapsed)}.`, true);
	if (overlayCta) overlayCta.classList.remove("hidden");
	if (state.difficulty === "easy" && state.secondsElapsed <= 60 && fastWin) fastWin.classList.remove("hidden");
	stopTimer();
};

if (fwSend) {
	fwSend.addEventListener("click", () => {
		const name = (fwName && fwName.value.trim()) || "";
		const contact = (fwContact && fwContact.value.trim()) || "";
		const time = SudokuEngine.formatTime(state.secondsElapsed);
		const msg = `Sudoku fast win!\nName: ${name}\nContact: ${contact}\nDifficulty: ${state.difficulty}\nTime: ${time}`;
		const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
		window.open(url, "_blank");
	});
}

// Restore or start a new game
window.addEventListener("load", () => {
	if (!restore()) {
		newGame();
	}
});

document.addEventListener("visibilitychange", () => {
	if (document.hidden) state.isPaused = true;
});

overlayClose.addEventListener("click", () => setOverlay("", "", false)); 