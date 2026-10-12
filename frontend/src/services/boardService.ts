import api from './api';
import { workspaceService } from './workspaceService';

export interface Board {
  id: string;
  title: string;
  description?: string;
  visibility?: string;
  workspace_id: string;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  background?: string;
  background_color?: string;
}

export interface CreateBoardPayload {
  title: string;
  workspace_id: string;
  background_color?: string;
  background?: string;
  visibility?: string;
}

export const getBoards = async (workspaceId?: string): Promise<Board[]> => {
  if (workspaceId) {
    const res = await api.get<Board[]>(`/workspaces/${workspaceId}/boards`);
    return res.data;
  }
  try {
    const workspaces = await workspaceService.getAllWorkspaces();
    if (!workspaces || workspaces.length === 0) {
      return [];
    }
    const results = await Promise.all(
      workspaces.map((ws) =>
        api.get<Board[]>(`/workspaces/${ws.id}/boards`).then((r) => r.data).catch(() => [])
      )
    );
    return results.flat();
  } catch {
    return [];
  }
};

export const getBoardById = async (id: string): Promise<Board> => {
  const res = await api.get<Board>(`/boards/${id}`);
  return res.data;
};

export const createBoard = async (payload: CreateBoardPayload): Promise<Board> => {
  const res = await api.post<Board>(`/workspaces/${payload.workspace_id}/boards`, {
    title: payload.title,
    visibility: payload.visibility?.toUpperCase() || 'WORKSPACE',
    background: payload.background || payload.background_color || null,
  });
  return res.data;
};

export const updateBoard = async (
  id: string,
  payload: Partial<{
    title: string;
    description?: string;
    visibility: string;
    is_archived: boolean;
    background?: string;
  }>
): Promise<Board> => {
  const res = await api.patch<Board>(`/boards/${id}`, payload);
  return res.data;
};

export const deleteBoard = async (id: string): Promise<void> => {
  await api.delete(`/boards/${id}`);
};

export interface BoardMemberItem {
  id: string;
  board_id: string;
  user_id: string;
  role: string;
  joined_at?: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

export const getBoardMembers = async (boardId: string): Promise<BoardMemberItem[]> => {
  const res = await api.get<BoardMemberItem[]>(`/boards/${boardId}/members`);
  return res.data;
};

export const addBoardMember = async (
  boardId: string,
  payload: { user_id: string; role?: 'ADMIN' | 'MEMBER' | 'OBSERVER' }
): Promise<BoardMemberItem> => {
  const res = await api.post<BoardMemberItem>(`/boards/${boardId}/members`, {
    user_id: payload.user_id,
    role: payload.role || 'MEMBER',
  });
  return res.data;
};

export const updateBoardMemberRole = async (
  boardId: string,
  userId: string,
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER'
): Promise<BoardMemberItem> => {
  const res = await api.patch<BoardMemberItem>(`/boards/${boardId}/members/${userId}`, { role });
  return res.data;
};

export const removeBoardMember = async (boardId: string, userId: string): Promise<void> => {
  await api.delete(`/boards/${boardId}/members/${userId}`);
};

export const boardService = {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  getBoardMembers,
  addBoardMember,
  updateBoardMemberRole,
  removeBoardMember,
};

export default boardService;
