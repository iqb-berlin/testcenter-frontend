export interface BookletData {
  id: string;
  filename: string;
  label: string;
}

export interface BookletDataListByCode {
  [code: string]: BookletData[];
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
  customTexts: KeyValuePair;
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
  customTexts: KeyValuePair;
  version: string;
}

export interface KeyValuePair {
  [K: string]: string;
}

export interface KeyValuePairNumber {
  [K: string]: number;
}

export interface WorkspaceData {
  id: number;
  name: string;
  role: string;
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
