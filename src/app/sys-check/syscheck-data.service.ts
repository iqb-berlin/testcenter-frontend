import { CheckConfigData } from './backend.service';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SyscheckDataService {
  public checkConfig$ = new BehaviorSubject<CheckConfigData>(null);
  public environmentData$ = new BehaviorSubject<ReportEntry[]>([]);
  public networkData$ = new BehaviorSubject<ReportEntry[]>([]);
  public questionnaireData$ = new BehaviorSubject<ReportEntry[]>([]);

  public unitcheckAvailable$ = new BehaviorSubject<boolean>(false);
  public questionnaireAvailable$ = new BehaviorSubject<boolean>(false);

  public unitcheckEnabled$ = new BehaviorSubject<boolean>(false);
  public questionnaireEnabled$ = new BehaviorSubject<boolean>(false);
  public reportEnabled$ = new BehaviorSubject<boolean>(false);
  public reportWithEmail$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.checkConfig$.subscribe(cDef => {
      this.environmentData$.next(null);
      this.networkData$.next(null);
      if (cDef === null) {
        this.reportWithEmail$.next(false);
        this.unitcheckAvailable$.next(false);
        this.questionnaireAvailable$.next(false);
      } else {
        this.reportWithEmail$.next(cDef.email);
        this.unitcheckAvailable$.next(cDef.unit.length > 0);
        this.questionnaireAvailable$.next(cDef.formdef.length > 0);
      }
    });
  }
}

export interface ReportEntry {
  label: string;
  value: string;
}

export interface NetworkRequestTestResult {
  'type': 'downloadTest' | 'uploadTest';
  'size': number;
  'duration': number;
}
