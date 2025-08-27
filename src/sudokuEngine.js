// Basic Sudoku engine: board representation, validation, solving, and generation
// Board is a 9x9 array of numbers 0-9, where 0 represents empty.

/** @typedef {number[][]} Board */

const BOARD_SIZE = 9;
const BOX_SIZE = 3;

const createEmptyBoard = () => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));

const isInRow = (board, row, value) => board[row].includes(value);

const isInCol = (board, col, value) => board.some((r) => r[col] === value);

const isInBox = (board, row, col, value) => {
	const startRow = row - (row % BOX_SIZE);
	const startCol = col - (col % BOX_SIZE);
	for (let r = 0; r < BOX_SIZE; r += 1) {
		for (let c = 0; c < BOX_SIZE; c += 1) {
			if (board[startRow + r][startCol + c] === value) return true;
		}
	}
	return false;
};

const isSafe = (board, row, col, value) => {
	if (value === 0) return true;
	return !isInRow(board, row, value) && !isInCol(board, col, value) && !isInBox(board, row, col, value);
};

const findEmpty = (board) => {
	for (let r = 0; r < BOARD_SIZE; r += 1) {
		for (let c = 0; c < BOARD_SIZE; c += 1) {
			if (board[r][c] === 0) return [r, c];
		}
	}
	return null;
};

const cloneBoard = (board) => board.map((row) => row.slice());

const solveBoard = (board) => {
	const b = cloneBoard(board);
	const solve = () => {
		const empty = findEmpty(b);
		if (!empty) return true;
		const [row, col] = empty;
		for (let num = 1; num <= 9; num += 1) {
			if (isSafe(b, row, col, num)) {
				b[row][col] = num;
				if (solve()) return true;
				b[row][col] = 0;
			}
		}
		return false;
	};
	const solved = solve();
	return { solved, board: b };
};

// Count number of solutions (for uniqueness checking) with an early cutoff
const countSolutions = (board, cutoff = 2) => {
	let count = 0;
	const b = cloneBoard(board);
	const backtrack = () => {
		if (count >= cutoff) return;
		const empty = findEmpty(b);
		if (!empty) {
			count += 1;
			return;
		}
		const [row, col] = empty;
		for (let num = 1; num <= 9; num += 1) {
			if (isSafe(b, row, col, num)) {
				b[row][col] = num;
				backtrack();
				b[row][col] = 0;
				if (count >= cutoff) return;
			}
		}
	};
	backtrack();
	return count;
};

const shuffle = (arr) => {
	for (let i = arr.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};

const fillDiagonalBoxes = (board) => {
	for (let k = 0; k < BOARD_SIZE; k += BOX_SIZE) {
		let nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		for (let r = 0; r < BOX_SIZE; r += 1) {
			for (let c = 0; c < BOX_SIZE; c += 1) {
				board[k + r][k + c] = nums[r * BOX_SIZE + c];
			}
		}
	}
};

const fillRemaining = (board, row = 0, col = 0) => {
	if (col === BOARD_SIZE) {
		row += 1;
		col = 0;
	}
	if (row === BOARD_SIZE) return true;

	if (board[row][col] !== 0) return fillRemaining(board, row, col + 1);

	for (let num = 1; num <= 9; num += 1) {
		if (isSafe(board, row, col, num)) {
			board[row][col] = num;
			if (fillRemaining(board, row, col + 1)) return true;
			board[row][col] = 0;
		}
	}
	return false;
};

const generateSolvedBoard = () => {
	const board = createEmptyBoard();
	fillDiagonalBoxes(board);
	fillRemaining(board, 0, 0);
	return board;
};

const makePuzzle = (solvedBoard, difficulty = "easy") => {
	const puzzle = cloneBoard(solvedBoard);
	const removalsByDifficulty = { easy: 36, medium: 45, hard: 54 };
	const removals = removalsByDifficulty[difficulty] ?? removalsByDifficulty.easy;

	const positions = shuffle(
		Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
	);

	let removed = 0;
	for (const [r, c] of positions) {
		if (removed >= removals) break;
		if (puzzle[r][c] !== 0) {
			puzzle[r][c] = 0;
			removed += 1;
		}
	}
	return puzzle;
};

const getCandidates = (board, row, col) => {
	if (board[row][col] !== 0) return [];
	const candidates = [];
	for (let num = 1; num <= 9; num += 1) {
		if (isSafe(board, row, col, num)) candidates.push(num);
	}
	return candidates;
};

const isCompleteAndValid = (board) => {
	for (let r = 0; r < 9; r += 1) {
		for (let c = 0; c < 9; c += 1) {
			const val = board[r][c];
			if (val === 0) return false;
			board[r][c] = 0;
			if (!isSafe(board, r, c, val)) {
				board[r][c] = val;
				return false;
			}
			board[r][c] = val;
		}
	}
	return true;
};

const formatTime = (seconds) => {
	const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
	const ss = Math.floor(seconds % 60).toString().padStart(2, "0");
	return `${mm}:${ss}`;
};

const SudokuEngine = {
	createEmptyBoard,
	generateSolvedBoard,
	makePuzzle,
	solveBoard,
	isSafe,
	findEmpty,
	getCandidates,
	isCompleteAndValid,
	cloneBoard,
	formatTime,
};

// UMD-style export for browser
window.SudokuEngine = SudokuEngine; 