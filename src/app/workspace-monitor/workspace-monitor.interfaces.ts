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

export interface BookletsStarted {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  locked: boolean;
  laststart: Date;
}
