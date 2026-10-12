import api from './api';

export interface CardItem {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  is_completed?: boolean;
  cover_color?: string | null;
  cover_image?: string | null;
  list_id: string;
  created_by: string;
  position: string | number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCardPayload {
  title: string;
  list_id: string;
  position?: number | string;
  description?: string;
  due_date?: string;
  cover_color?: string | null;
  cover_image?: string | null;
}

export interface UpdateCardPayload {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  is_completed?: boolean;
  is_archived?: boolean;
  cover_color?: string | null;
  cover_image?: string | null;
  list_id?: string;
  position?: number | string;
}

export const getCardsByList = async (listId: string, includeArchived = false): Promise<CardItem[]> => {
  const res = await api.get<CardItem[]>(`/lists/${listId}/cards`, {
    params: includeArchived ? { include_archived: true } : undefined,
  });
  return res.data;
};

export const getCardById = async (id: string): Promise<CardItem> => {
  const res = await api.get<CardItem>(`/cards/${id}`);
  return res.data;
};

export const createCard = async (payload: CreateCardPayload): Promise<CardItem> => {
  const res = await api.post<CardItem>(`/lists/${payload.list_id}/cards`, {
    title: payload.title,
    description: payload.description,
    due_date: payload.due_date,
    position: payload.position,
  });
  return res.data;
};

export const updateCard = async (
  id: string,
  payload: UpdateCardPayload
): Promise<CardItem> => {
  const res = await api.patch<CardItem>(`/cards/${id}`, payload);
  return res.data;
};

export const moveCard = async (
  id: string,
  payload: { list_id: string; position?: number | string }
): Promise<CardItem> => {
  const res = await api.post<CardItem>(`/cards/${id}/move`, {
    target_list_id: payload.list_id,
    position: payload.position,
  });
  return res.data;
};

export const deleteCard = async (id: string): Promise<void> => {
  await api.delete(`/cards/${id}`);
};

// ================= Checklists =================
export interface BackendChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  is_completed?: boolean;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BackendChecklist {
  id: string;
  card_id: string;
  title: string;
  position?: number;
  items: BackendChecklistItem[];
  created_at?: string;
  updated_at?: string;
}

export const getCardChecklists = async (cardId: string): Promise<BackendChecklist[]> => {
  const res = await api.get<BackendChecklist[]>(`/cards/${cardId}/checklists`);
  return res.data;
};

export const createCardChecklist = async (cardId: string, title: string): Promise<BackendChecklist> => {
  const res = await api.post<BackendChecklist>(`/cards/${cardId}/checklists`, { title });
  return res.data;
};

export const deleteChecklist = async (checklistId: string): Promise<void> => {
  await api.delete(`/checklists/${checklistId}`);
};

export const createChecklistItem = async (checklistId: string, content: string): Promise<BackendChecklistItem> => {
  const res = await api.post<BackendChecklistItem>(`/checklists/${checklistId}/items`, { content });
  return res.data;
};

export const updateChecklistItem = async (
  itemId: string,
  payload: { is_completed?: boolean; content?: string }
): Promise<BackendChecklistItem> => {
  const res = await api.patch<BackendChecklistItem>(`/checklists/items/${itemId}`, payload);
  return res.data;
};

export const deleteChecklistItem = async (itemId: string): Promise<void> => {
  await api.delete(`/checklists/items/${itemId}`);
};

// ================= Labels =================
export interface BackendLabel {
  id: string;
  board_id?: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export const getCardLabels = async (cardId: string): Promise<BackendLabel[]> => {
  const res = await api.get<BackendLabel[]>(`/cards/${cardId}/labels`);
  return res.data;
};

export const attachCardLabel = async (cardId: string, labelId: string): Promise<void> => {
  await api.post(`/cards/${cardId}/labels/${labelId}`);
};

export const detachCardLabel = async (cardId: string, labelId: string): Promise<void> => {
  await api.delete(`/cards/${cardId}/labels/${labelId}`);
};

export const getBoardLabels = async (boardId: string): Promise<BackendLabel[]> => {
  const res = await api.get<BackendLabel[]>(`/boards/${boardId}/labels`);
  return res.data;
};

export const createBoardLabel = async (
  boardId: string,
  payload: { name: string; color: string }
): Promise<BackendLabel> => {
  const res = await api.post<BackendLabel>(`/boards/${boardId}/labels`, payload);
  return res.data;
};

// ================= Members =================
export interface BackendCardMember {
  id: string;
  card_id: string;
  user_id: string;
  assigned_at?: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

export const getCardMembers = async (cardId: string): Promise<BackendCardMember[]> => {
  const res = await api.get<BackendCardMember[]>(`/cards/${cardId}/members`);
  return res.data;
};

export const assignCardMember = async (cardId: string, userId: string): Promise<BackendCardMember> => {
  const res = await api.post<BackendCardMember>(`/cards/${cardId}/members`, { user_id: userId });
  return res.data;
};

export const removeCardMember = async (cardId: string, userId: string): Promise<void> => {
  await api.delete(`/cards/${cardId}/members/${userId}`);
};

// ================= Comments & Activity =================
export interface BackendComment {
  id: string;
  card_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface BackendActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  metadata?: Record<string, any>;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

export const getCardComments = async (cardId: string): Promise<BackendComment[]> => {
  const res = await api.get<BackendComment[]>(`/cards/${cardId}/comments`);
  return res.data;
};

export const createCardComment = async (cardId: string, content: string): Promise<BackendComment> => {
  const res = await api.post<BackendComment>(`/cards/${cardId}/comments`, { content });
  return res.data;
};

export const deleteCardComment = async (commentId: string): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
};

export const getCardActivity = async (cardId: string): Promise<BackendActivityLog[]> => {
  const res = await api.get<BackendActivityLog[]>(`/cards/${cardId}/activity`);
  return res.data;
};

// ================= Attachments =================
export interface BackendAttachment {
  id: string;
  card_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_size: number;
  content_type?: string | null;
  created_at: string;
}

export const getCardAttachments = async (cardId: string): Promise<BackendAttachment[]> => {
  const res = await api.get<BackendAttachment[]>(`/cards/${cardId}/attachments`);
  return res.data;
};

export const createCardAttachment = async (
  cardId: string,
  payload: { file_name: string; file_url: string; file_size: number; content_type?: string | null }
): Promise<BackendAttachment> => {
  const res = await api.post<BackendAttachment>(`/cards/${cardId}/attachments`, payload);
  return res.data;
};

export const uploadCardAttachment = async (
  cardId: string,
  file: File
): Promise<BackendAttachment> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<BackendAttachment>(`/cards/${cardId}/attachments/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const deleteCardAttachment = async (attachmentId: string): Promise<void> => {
  await api.delete(`/attachments/${attachmentId}`);
};

export const cardService = {
  getCardsByList,
  getCardById,
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  // Checklists
  getCardChecklists,
  createCardChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  // Labels
  getCardLabels,
  attachCardLabel,
  detachCardLabel,
  getBoardLabels,
  createBoardLabel,
  // Members
  getCardMembers,
  assignCardMember,
  removeCardMember,
  // Comments & Activity
  getCardComments,
  createCardComment,
  deleteCardComment,
  getCardActivity,
  // Attachments
  getCardAttachments,
  createCardAttachment,
  uploadCardAttachment,
  deleteCardAttachment,
};

export default cardService;
