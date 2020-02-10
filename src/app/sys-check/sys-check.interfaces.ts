export interface CheckConfig {
  id: string;
  label: string;
  description: string;
}

export interface SpeedParameters {
  min: number;
  good: number;
  maxDevianceBytesPerSecond: number;
  maxErrorsPerSequence: number;
  maxSequenceRepetitions: number;
  sequenceSizes: number[];
}

export interface CheckConfigData {
  id: string;
  label: string;
  questions: FormDefEntry[];
  hasunit: boolean;
  cansave: boolean;
  customtexts: CustomText[];
  skipnetwork: boolean;
  downloadspeed: SpeedParameters;
  uploadspeed: SpeedParameters;
}

export interface FormDefEntry {
  id: string;
  type: string;
  prompt: string;
  value: string;
  options: string[];
  required: boolean;
}

export interface CustomText {
  key: string;
  value: string;
}

export interface UnitData {
  key: string;
  label: string;
  def: string;
  player: string;
  player_id: string;
  duration: number;
}

export interface NetworkRequestTestResult {
  'type': 'downloadTest' | 'uploadTest';
  'size': number;
  'duration': number;
  'error': string | null;
  'speedInBPS': number;
}

export interface ReportEntry {
  id: string;
  type: string;
  label: string;
  value: string;
  warning: boolean;
}

export interface NetworkCheckStatus {
  message: string;
  avgUploadSpeedBytesPerSecond: number;
  avgDownloadSpeedBytesPerSecond: number;
  done: boolean;
}

export type TechCheckRating = 'N/A' | 'insufficient' | 'ok' | 'good' | 'unstable';

export interface NetworkRating {
  uploadRating: TechCheckRating;
  downloadRating: TechCheckRating;
  overallRating: TechCheckRating;
}

export interface DetectedNetworkInformation {
  available: boolean;
  downlinkMegabitPerSecond: number;
  effectiveNetworkType: string;
  roundTripTimeMs: number;
  networkType: string;
}
