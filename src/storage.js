const STORAGE_KEYS = {
	state: "igh_sudoku_state",
	prefs: "igh_sudoku_prefs",
};

const saveState = (state) => {
	try {
		localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
	} catch {}
};

const loadState = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEYS.state);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

const savePrefs = (prefs) => {
	try {
		localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify(prefs));
	} catch {}
};

const loadPrefs = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEYS.prefs);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
};

window.SudokuStorage = { saveState, loadState, savePrefs, loadPrefs }; 