import api from './api';

export interface BoardList {
  id: string;
  title: string;
  board_id: string;
  position: string | number;
  is_archived: boolean;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateListPayload {
  title: string;
  board_id: string;
  position?: number | string;
  color?: string | null;
}

export const getListsByBoard = async (boardId: string, includeArchived = false): Promise<BoardList[]> => {
  const res = await api.get<BoardList[]>(`/boards/${boardId}/lists`, {
    params: includeArchived ? { include_archived: true } : undefined,
  });
  return res.data;
};

export const createList = async (payload: CreateListPayload): Promise<BoardList> => {
  const res = await api.post<BoardList>(`/boards/${payload.board_id}/lists`, {
    title: payload.title,
    position: payload.position,
    color: payload.color,
  });
  return res.data;
};

export const updateList = async (
  id: string,
  payload: Partial<{ title: string; position: number | string; is_archived: boolean; color: string | null }>
): Promise<BoardList> => {
  const res = await api.patch<BoardList>(`/lists/${id}`, payload);
  return res.data;
};

export const moveList = async (
  id: string,
  payload: { position: number }
): Promise<BoardList> => {
  const res = await api.post<BoardList>(`/lists/${id}/move`, {
    position: payload.position,
  });
  return res.data;
};

export const deleteList = async (id: string): Promise<void> => {
  await api.delete(`/lists/${id}`);
};

export const listService = {
  getListsByBoard,
  createList,
  updateList,
  moveList,
  deleteList,
};

export default listService;

