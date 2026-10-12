// src/services/boardNavService.ts

export interface BoardNavItem {
  id: string;
  title: string;
  workspaceId?: string;
  workspaceName?: string;
  background?: string | null;
  isStarred?: boolean;
  lastVisited?: number;
}

const STARRED_KEY = 'trello_starred_boards';
const RECENT_KEY = 'trello_recent_boards';

/**
 * Retrieve all starred boards from persistent storage.
 */
export const getStarredBoards = (): BoardNavItem[] => {
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse starred boards:', err);
    return [];
  }
};

/**
 * Check if a board is currently starred.
 */
export const isBoardStarred = (boardId: string): boolean => {
  if (!boardId) return false;
  const starred = getStarredBoards();
  return starred.some((b) => b.id === boardId);
};

/**
 * Add a board to starred list.
 */
export const starBoard = (board: BoardNavItem): void => {
  if (!board || !board.id) return;
  const starred = getStarredBoards();
  const existingIndex = starred.findIndex((b) => b.id === board.id);

  let updated: BoardNavItem[];
  if (existingIndex >= 0) {
    updated = starred.map((b) =>
      b.id === board.id ? { ...b, ...board, isStarred: true } : b
    );
  } else {
    updated = [{ ...board, isStarred: true }, ...starred];
  }

  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('trello_board_nav_updated', { detail: { boardId: board.id, starred: true } }));
  } catch (err) {
    console.warn('Failed to save starred boards:', err);
  }
};

/**
 * Remove a board from starred list.
 */
export const unstarBoard = (boardId: string): void => {
  if (!boardId) return;
  const starred = getStarredBoards();
  const updated = starred.filter((b) => b.id !== boardId);

  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('trello_board_nav_updated', { detail: { boardId, starred: false } }));
  } catch (err) {
    console.warn('Failed to remove starred board:', err);
  }
};

/**
 * Toggle star state for a given board.
 */
export const toggleStarBoard = (board: BoardNavItem): boolean => {
  if (isBoardStarred(board.id)) {
    unstarBoard(board.id);
    return false;
  } else {
    starBoard(board);
    return true;
  }
};

/**
 * Retrieve recent boards ordered by last visited.
 */
export const getRecentBoards = (): BoardNavItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse recent boards:', err);
    return [];
  }
};

/**
 * Record a board visit to recent boards (deduplicating and updating timestamp).
 */
export const recordRecentBoard = (board: BoardNavItem): void => {
  if (!board || !board.id) return;
  try {
    const recent = getRecentBoards().filter((b) => b.id !== board.id);
    const updated = [
      {
        ...board,
        isStarred: isBoardStarred(board.id),
        lastVisited: Date.now(),
      },
      ...recent,
    ].slice(0, 15); // keep top 15 most recent

    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('trello_board_nav_updated', { detail: { recentBoardId: board.id } }));
  } catch (err) {
    console.warn('Failed to record recent board:', err);
  }
};

/**
 * Listen for navigation/star changes across tabs and components.
 */
export const onBoardNavChange = (callback: () => void): (() => void) => {
  const handler = () => callback();
  window.addEventListener('trello_board_nav_updated', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('trello_board_nav_updated', handler);
    window.removeEventListener('storage', handler);
  };
};

export const boardNavService = {
  getStarredBoards,
  isBoardStarred,
  starBoard,
  unstarBoard,
  toggleStarBoard,
  getRecentBoards,
  recordRecentBoard,
  onBoardNavChange,
};

export default boardNavService;
