import { CheckConfigData, ReportEntry } from './backend.service';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

type Task = 'loadunit' | 'speedtest' | null;

@Injectable({
  providedIn: 'root'
})
export class SyscheckDataService {

  public checkConfig$ = new BehaviorSubject<CheckConfigData>(null);

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

    this.checkConfig$.subscribe(cDef => {
      this.networkData$.next([]);
      this.unitData$.next([]);
    });
    this.taskQueue = [];
  }

  nextTask() {
    this.task$.next(this.taskQueue.pop());
  }
}
