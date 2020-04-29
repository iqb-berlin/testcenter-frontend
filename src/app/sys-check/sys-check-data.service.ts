import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { CheckConfig, ReportEntry } from './sys-check.interfaces';

type Task = 'loadunit' | 'speedtest' | null;

@Injectable({
  providedIn: 'root'
})
export class SysCheckDataService {

  public checkConfig$ = new BehaviorSubject<CheckConfig>(null);

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
