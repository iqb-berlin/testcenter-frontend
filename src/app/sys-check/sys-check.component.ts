import { SysCheckDataService } from './sys-check-data.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import {Component, OnDestroy, OnInit} from '@angular/core';
import { BackendService } from './backend.service';
import { Subscription } from 'rxjs';
import { CustomtextService } from 'iqb-components';


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
export class SysCheckComponent implements OnInit, OnDestroy {
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
    private ds: SysCheckDataService,
    private route: ActivatedRoute,
    private cts: CustomtextService
  ) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {

      const sysCheckName = params.get('sys-check-name');
      const workspaceId = parseInt(params.get('workspace-id'));
      this.bs.getCheckConfigData(workspaceId, sysCheckName).subscribe(checkConfig => {
        this.ds.checkConfig$.next(checkConfig);

        this.title = checkConfig.label;
        this.checks.unit = checkConfig.hasUnit;
        this.checks.network = !checkConfig.skipNetwork;
        this.checks.questions = checkConfig.questions.length > 0;
        this.checks.report = checkConfig.canSave;

        if (this.checks.unit) {
          this.ds.taskQueue.push('loadunit');
        }
        if (this.checks.network) {
          this.ds.taskQueue.push('speedtest');
        }
        if (checkConfig.customTexts.length > 0) {
          const myCustomTexts: {[key: string]: string} = {};
          checkConfig.customTexts.forEach(ct => {
            myCustomTexts[ct.key] = ct.value;
          });
          this.cts.addCustomTexts(myCustomTexts);
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
