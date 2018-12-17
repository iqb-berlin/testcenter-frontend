import { CheckConfigData } from './backend.service';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SyscheckDataService {
  public checkConfig$ = new BehaviorSubject<CheckConfigData>(null);
  public environmentData$ = new BehaviorSubject<EnvironmentData>(null);
  public networkData$ = new BehaviorSubject<NetworkData>(null);

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

  public calculateNetworkRating(nd: NetworkData): NetworkRating {

    /*

    <1MB download und <0.5 MB upload ---> insufficient (~ < 8Mb download; ~ < 4Mb upload)
    1-10 MB download; 0.5 - 5 MB upload ---> ok (8-80 Mb download; 4-40 Mb upload)
    > 10 MB download; > 0.5 MB upload; ----> good (> 80 Mb download; > 40 Mb upload;)

    */

    if ((nd.downloadTest < 1024 * 1024) || (nd.uploadTest < 1024 * 512)) {
        return 'insufficient';
    } else {
        if ((nd.downloadTest < 1024 * 1024 * 10) || (nd.uploadTest < 1024 * 1024 * 5)) {
          return 'ok';
        } else {
          return 'good';
        }
    }
  }

}

export interface EnvironmentData {
  osName: string;
  osVersion: string;
}

export interface NetworkData {
  uploadTest: number;
  downloadTest: number;
  pingTest: number;
}

export interface NetworkRequestTestResult {
  'type': 'downloadTest' | 'uploadTest';
  'size': number;
  'duration': number;
}

export type NetworkRating = 'N/A' | 'insufficient' | 'ok' | 'good';
