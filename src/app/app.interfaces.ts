export interface WorkspaceData {
  id: number;
  name: string;
  role: string;
}

export interface LoginData {
  admintoken: string;
  name: string;
  workspaces: WorkspaceData[];
  is_superadmin: boolean;
}
