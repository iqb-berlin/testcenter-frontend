export interface WorkspaceData {
  id: string;
  name: string;
  role: 'RW' | 'RO' | 'n.d.';
}

export interface GetFileResponseData {
  name: string;
  size: number;
  modificationTime: string;
  type: string;
  isChecked: boolean;
  report: {
    error: string[];
    warning: string[];
    info: string[];
  },
  info: {
    [key: string]: string|number;
  }
}

export interface GroupResponse {
  name: string;
  testsTotal: number;
  testsStarted: number;
  responsesGiven: number;
}

export interface BookletsStarted {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  locked: boolean;
  laststart: Date;
}

export interface UnitResponse {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  unitname: string;
  responses: string;
  restorepoint: string;
  responsetype: string;
  responses_ts: number;
  restorepoint_ts: number;
  laststate: string;
}

export interface MonitorData {
  groupname: string;
  loginsPrepared: number;
  personsPrepared: number;
  bookletsPrepared: number;
  bookletsStarted: number;
  bookletsLocked: number;
  laststart: Date;
  laststartStr: string;
}

export interface ResultData {
  groupname: string;
  bookletsStarted: number;
  num_units_min: number;
  num_units_max: number;
  num_units_mean: number;
  lastchange: number;
}

export interface LogData {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  unitname: string;
  timestamp: number;
  logentry: string;
}

export interface ReviewData {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  unitname: string;
  priority: number;
  categories: string;
  reviewtime: Date;
  entry: string;
}

export interface SysCheckStatistics {
  id: string;
  label: string;
  count: number;
  details: string[];
}
