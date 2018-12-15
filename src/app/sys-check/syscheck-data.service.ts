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

    <100 KB download und <50KB upload ---> unzureichend
    100KB - 1MB download; 50KB - 1MB upload ---> langsam
    1MB download - 10MB download; 1 MB upload bis 10MB upload; ---> ok
    10MB - 100MB download; 10MB to 100MB upload; ---> schnell
    100MB - 1000MB download; 100MB to 1000MB upload; ---> sehr schnell
    1000+ download; 1000+ upload; ----> wow

    */

    if ((nd.downloadTest < 1024 * 100) || (nd.uploadTest < 1024 * 50)) {
        return 'unzureichend';
    } else {
      if ((nd.downloadTest < 1024 * 1024) || (nd.uploadTest < 1024 * 1024)) {
          return 'langsam';
      } else {
          if ((nd.downloadTest < 1024 * 1024 * 10) || (nd.uploadTest < 1024 * 1024 * 10)) {
              return 'ok';
          } else {
              if ((nd.downloadTest < 1024 * 1024 * 100) || (nd.uploadTest < 1024 * 1024 * 100)) {
                  return 'schnell';
              } else {
                  if ((nd.downloadTest < 1024 * 1024 * 1000) || (nd.uploadTest < 1024 * 1024 * 1000)) {
                      return 'sehr schnell';
                  } else {
                      return 'wow';
                  }
              }
          }
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

export type NetworkRating = 'N/A' | 'unzureichend' | 'langsam' | 'ok' | 'schnell' | 'sehr schnell' | 'wow';
