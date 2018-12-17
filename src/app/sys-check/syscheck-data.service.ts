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

    <100 KB download und <50KB upload ---> insufficient (~ < 1Mb download; ~ < 512Kb upload)
    100 KB - 200 KB download; 50KB - 100 KB upload; ---> slow (~ 1-2Mb download; ~ 0.5-1 Mb upload)
    200 KB - 1MB download; 100KB - 1MB upload ---> ok (~ 2-8Mb download; <  1-8Mb upload)
    1MB download - 10MB download; 1 MB upload - 10MB upload; ---> fast (~ 8-80Mb download; ~ 8-80Mb upload)
    10MB - 100MB download; 10MB to 100MB upload; ---> very fast (~ 80-800 Mb download; ~80-800Mb upload)
    100MB+ download; 100MB+ upload; ----> wow (> 800 Mb download; > 800 Mb upload)

    */

    if ((nd.downloadTest < 1024 * 100) || (nd.uploadTest < 1024 * 50)) {
        return 'insufficient';
    } else {
      if ((nd.downloadTest < 1024 * 200) || (nd.uploadTest < 1024 * 100)) {
        return 'slow';
      } else {
        if ((nd.downloadTest < 1024 * 1024) || (nd.uploadTest < 1024 * 1024)) {
            return 'ok';
        } else {
            if ((nd.downloadTest < 1024 * 1024 * 10) || (nd.uploadTest < 1024 * 1024 * 10)) {
                return 'fast';
            } else {
                if ((nd.downloadTest < 1024 * 1024 * 100) || (nd.uploadTest < 1024 * 1024 * 100)) {
                    return 'very fast';
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

export type NetworkRating = 'N/A' | 'insufficient' | 'very slow' | 'slow' | 'ok' | 'fast' | 'very fast' | 'wow';
