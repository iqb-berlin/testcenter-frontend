import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { CheckConfig, ReportEntry } from './sys-check.interfaces';

type Task = 'loadunit' | 'speedtest' | null;

@Injectable({
  providedIn: 'root'
})
export class SysCheckDataService {
  public checkConfig: CheckConfig = null;
  public task$ = new BehaviorSubject<Task>(null);
  public taskQueue: Task[] = [];
  public environmentData$ = new BehaviorSubject<ReportEntry[]>([]);
  public networkData$ = new BehaviorSubject<ReportEntry[]>([]);
  public questionnaireData$ = new BehaviorSubject<ReportEntry[]>([]);
  public unitData$ = new BehaviorSubject<ReportEntry[]>([]);

  nextTask() {
    this.task$.next(this.taskQueue.pop());
  }
}
