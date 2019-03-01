export interface BookletData {
  id: string;
  filename: string;
  label: string;
}

export interface BookletDataListByCode {
  [code: string]: BookletData[];
}

export interface LoginData {
  logintoken: string;
  loginname: string;
  mode: string;
  groupname: string;
  workspaceName: string;
  booklets: BookletDataListByCode;
  persontoken: string;
  code: string;
  booklet: number;
}

export interface BookletStatus {
  statusLabel: string;
  lastUnit: number;
  canStart: boolean;
  id: number;
  label: string;
}

export interface PersonTokenAndBookletId {
  pt: string;
  b: number;
}
