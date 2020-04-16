export enum AuthFlagType {
  CODE_REQUIRED = "codeRequired",
  PENDING = "pending",
  EXPIRED = "expired"
}

export enum AuthAccessKeyType {
  WORKSPACE_ADMIN = "workspaceAdmin",
  SUPER_ADMIN = "superAdmin",
  TEST = "test",
  WORKSPACE_MONITOR = "workspaceMonitor",
  TEST_GROUP_MONITOR = "testGroupMonitor"
}

export interface AccessType {
  [key: string]: string[];
}

export interface AuthData {
  token: string;
  displayName: string;
  customTexts: KeyValuePairs;
  flags: AuthFlagType[];
  access: AccessType;
}

export interface WorkspaceData {
  id: string;
  name: string;
  role: "RW" | "RO" | "n.d.";
}

export interface BookletData {
  id: string;
  label: string;
  isEnabled: boolean;
  statusText: string
}

export interface BookletListByCode {
  [code: string]: string[];
}

export interface LoginData {
  loginToken: string;
  personToken: string;
  code: string; // TODO after https://github.com/iqb-berlin/testcenter-iqb-ng/issues/52 remove
  name: string;
  mode: string;
  groupName: string;
  workspaceName: string;
  booklets: BookletListByCode;
  testId: number;
  bookletLabel: string;
  customTexts: KeyValuePairs;
  adminToken: string;
  workspaces: WorkspaceData[];
  isSuperadmin: boolean;
}

export interface BookletStatus {
  statusLabel: string;
  lastUnit: number;
  canStart: boolean;
  id: number;
  label: string;
}

export interface PersonTokenAndTestId {
  personToken: string;
  testId: number;
}

export interface SysConfig {
  customTexts: KeyValuePairs;
  version: string;
}

export interface KeyValuePairs {
  [K: string]: string;
}

export interface KeyValuePairNumber {
  [K: string]: number;
}

export interface AppError {
  label: string;
  description: string;
  category: 'WARNING' | 'FATAL' | 'PROBLEM'
}

export interface starterData {
  id: string;
  label: string
}

export interface SysCheckInfo {
  workspaceId: string;
  name: string;
  label: string;
  description: string;
}
