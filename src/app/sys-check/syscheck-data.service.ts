import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SyscheckDataService {
  public environmentData$ = new BehaviorSubject<EnvironmentData>(null);
  public networkData$ = new BehaviorSubject<NetworkData>(null);

  public unitcheckAvailable$ = new BehaviorSubject<boolean>(false);
  public questionnaireAvailable$ = new BehaviorSubject<boolean>(false);

  public unitcheckEnabled$ = new BehaviorSubject<boolean>(false);
  public questionnaireEnabled$ = new BehaviorSubject<boolean>(false);
  public reportEnabled$ = new BehaviorSubject<boolean>(false);
  constructor() { }
}

export interface EnvironmentData {
  osName: string;
  osVersion: string;
}

export interface NetworkData {
  speedindicator: number;
}

