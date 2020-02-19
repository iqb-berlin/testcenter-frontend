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
  logintoken: string;
  loginname: string;
  mode: string;
  groupname: string;
  workspaceName: string;
  booklets: BookletListByCode;
  persontoken: string;
  code: string;
  booklet: number;
  bookletlabel: string;
  customTexts: KeyValuePair;
  costumTexts: KeyValuePair; // TODO when backend fixed then change here
}

export interface BookletStatus {
  statusLabel: string;
  lastUnit: number;
  canStart: boolean;
  id: number;
  label: string;
}

export interface PersonTokenAndBookletDbId {
  persontoken: string;
  bookletDbId: number;
}

export interface KeyValuePair {
  [K: string]: string;
}

export interface KeyValuePairNumber {
  [K: string]: number;
}
