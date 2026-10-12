import api from './api';

export interface WorkspaceInvitationItem {
  id: string;
  workspace_id: string;
  invited_by: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
}

export interface SendInvitationPayload {
  email: string;
  role?: 'ADMIN' | 'MEMBER';
}

export const invitationService = {
  // Invite member to workspace
  async inviteMember(
    workspaceId: string,
    payload: SendInvitationPayload
  ): Promise<WorkspaceInvitationItem> {
    const res = await api.post<WorkspaceInvitationItem>(
      `/workspaces/${workspaceId}/invitations`,
      {
        email: payload.email,
        role: payload.role || 'MEMBER',
      }
    );
    return res.data;
  },

  // Get all invitations for a workspace (Admin view)
  async getWorkspaceInvitations(
    workspaceId: string
  ): Promise<WorkspaceInvitationItem[]> {
    const res = await api.get<WorkspaceInvitationItem[]>(
      `/workspaces/${workspaceId}/invitations`
    );
    return res.data;
  },

  // Revoke/delete an invitation
  async revokeInvitation(
    workspaceId: string,
    invitationId: string
  ): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
  },

  // Accept invitation using token
  async acceptInvitation(token: string): Promise<any> {
    const res = await api.post(`/invitations/${token}/accept`);
    return res.data;
  },

  // Decline invitation using token
  async declineInvitation(token: string): Promise<void> {
    await api.post(`/invitations/${token}/decline`);
  },

  // Fetch pending invitations for the logged-in user
  async getMyPendingInvitations(): Promise<any[]> {
    const res = await api.get('/invitations/my-pending');
    return res.data;
  },
};

export default invitationService;
