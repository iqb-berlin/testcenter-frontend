import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import {CheckConfigData, ReportEntry} from "./sys-check.interfaces";

type Task = 'loadunit' | 'speedtest' | null;

@Injectable({
  providedIn: 'root'
})
export class SyscheckDataService {

  public checkConfig$ = new BehaviorSubject<CheckConfigData>(
    {
      id: 'Basistest',
      label: 'Basistest',
      questions: [],
      hasunit: false,
      cansave: false,
      customtexts: [],
      skipnetwork: false,
      downloadspeed : {
        min: 1.875e+6, // 15Mbit/s ~> typical dl speed 4G CAT4
        good: 3.75e+6, // 30Mbit/s ~> typical dl speed 4G+ CAT6
        maxDevianceBytesPerSecond: 100000,
        maxErrorsPerSequence: 0,
        maxSequenceRepetitions: 15,
        sequenceSizes: [400000, 800000, 1600000, 3200000]
      },
      uploadspeed : {
        min: 250000, // 2Mbit/s
        good: 1.25e+6, // 10Mbit/s
        maxDevianceBytesPerSecond: 5000,
        maxErrorsPerSequence: 0,
        maxSequenceRepetitions: 15,
        sequenceSizes: [100000, 200000, 400000, 800000]
      }
    }
  );

  public task$ = new BehaviorSubject<Task>(null);
  public taskQueue: Task[];

  public environmentData$ = new BehaviorSubject<ReportEntry[]>([]);
  public networkData$ = new BehaviorSubject<ReportEntry[]>([]);
  public questionnaireData$ = new BehaviorSubject<ReportEntry[]>([]);
  public unitData$ = new BehaviorSubject<ReportEntry[]>([]);

  // for Navi-Buttons:
  public itemplayerValidPages$ = new BehaviorSubject<string[]>([]);
  public itemplayerCurrentPage$ = new BehaviorSubject<string>('');
  public itemplayerPageRequest$ = new BehaviorSubject<string>('');

  constructor() {

    this.checkConfig$.subscribe(() => {
      this.networkData$.next([]);
      this.unitData$.next([]);
    });
    this.taskQueue = [];
  }

  nextTask() {
    this.task$.next(this.taskQueue.pop());
  }
}
