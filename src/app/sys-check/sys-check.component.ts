import { SyscheckDataService } from './syscheck-data.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit} from '@angular/core';
import { BackendService } from './backend.service';
import { Subscription } from 'rxjs';


interface Checks {
  environment: boolean;
  unit: boolean;
  questions: boolean;
  network: boolean;
  report: boolean;
}

@Component({
  selector: 'app-run',
  templateUrl: './sys-check.component.html',
  styleUrls: ['./sys-check.component.scss']
})
export class SysCheckComponent implements OnInit {
  private taskSubscription: Subscription = null;
  dataLoading = false;

  checks: Checks = {
    environment: true,
    unit: false,
    questions: false,
    network: false,
    report: true
  };

  title: String = '';

  constructor(
    private bs: BackendService,
    private ds: SyscheckDataService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const paramId = params.get('c');
      this.bs.getCheckConfigData(paramId).subscribe(checkConfig => {
        this.ds.checkConfig$.next(checkConfig);

        this.title = checkConfig.label;
        this.checks.unit = checkConfig.hasunit;
        this.checks.network = !checkConfig.skipnetwork;
        this.checks.questions = checkConfig.questions.length > 0;
        this.checks.report = checkConfig.cansave;

        if (this.checks.unit) {
          this.ds.taskQueue.push('loadunit');
        }
        if (this.checks.network) {
          this.ds.taskQueue.push('speedtest');
        }
        this.ds.nextTask();
        this.taskSubscription = this.ds.task$.subscribe(task => {
          this.dataLoading = (typeof task !== 'undefined') && (this.ds.taskQueue.length > 0);
        });

      });
    });
  }

  ngOnDestroy() {
    if (this.taskSubscription !== null) {
      this.taskSubscription.unsubscribe();
    }
  }
}
