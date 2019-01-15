import { CheckConfigData } from './backend.service';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { e } from '@angular/core/src/render3';

@Injectable({
  providedIn: 'root'
})
export class SyscheckDataService {
  public pageTitle$ = new BehaviorSubject<string>('IQB-Testcenter - System-Check');

  public checkConfig$ = new BehaviorSubject<CheckConfigData>(null);
  public environmentData$ = new BehaviorSubject<ReportEntry[]>([]);
  public networkData$ = new BehaviorSubject<ReportEntry[]>([]);
  public questionnaireData$ = new BehaviorSubject<ReportEntry[]>([]);

  public unitcheckAvailable$ = new BehaviorSubject<boolean>(false);
  public questionnaireAvailable$ = new BehaviorSubject<boolean>(false);

  public unitcheckEnabled$ = new BehaviorSubject<boolean>(false);
  public questionnaireEnabled$ = new BehaviorSubject<boolean>(false);
  public reportEnabled$ = new BehaviorSubject<boolean>(false);
  public saveReport$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.checkConfig$.subscribe(cDef => {
      this.networkData$.next([]);
      this.questionnaireData$.next([]);
      if (cDef === null) {
        this.saveReport$.next(false);
        this.unitcheckAvailable$.next(false);
        this.questionnaireAvailable$.next(false);
      } else {
        this.saveReport$.next(cDef.cansave);
        this.unitcheckAvailable$.next(cDef.hasunit);
        this.questionnaireAvailable$.next(cDef.questions.length > 0);
      }
    });
  }

  setPageTitle() {
    this.pageTitle$.next('IQB-Testcenter - System-Check');
  }
}

export interface ReportEntry {
  label: string;
  value: string;
}

