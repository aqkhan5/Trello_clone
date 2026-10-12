import api from './api';

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  joined_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

export const getAllWorkspaces = async (): Promise<Workspace[]> => {
  const res = await api.get<Workspace[]>('/workspaces');
  return res.data;
};

export const getWorkspaceById = async (id: string): Promise<Workspace> => {
  const res = await api.get<Workspace>(`/workspaces/${id}`);
  return res.data;
};

export const createWorkspace = async (payload: {
  name: string;
  description?: string;
}): Promise<Workspace> => {
  const res = await api.post<Workspace>('/workspaces', payload);
  return res.data;
};

export const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
  const res = await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
  return res.data;
};

export const updateWorkspaceMemberRole = async (
  workspaceId: string,
  userId: string,
  role: 'ADMIN' | 'MEMBER'
): Promise<WorkspaceMember> => {
  const res = await api.patch<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}`, {
    role,
  });
  return res.data;
};

export const removeWorkspaceMember = async (
  workspaceId: string,
  userId: string
): Promise<void> => {
  await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
};

export const updateWorkspace = async (
  id: string,
  payload: { name?: string; description?: string }
): Promise<Workspace> => {
  const res = await api.patch<Workspace>(`/workspaces/${id}`, payload);
  return res.data;
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  await api.delete(`/workspaces/${id}`);
};

export const workspaceService = {
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  getWorkspaceMembers,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  updateWorkspace,
  deleteWorkspace,
};

export default workspaceService;
