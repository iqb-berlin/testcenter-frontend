import { SyscheckDataService } from './syscheck-data.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit} from '@angular/core';
import {BackendService} from './backend.service';
import {CheckConfigData} from "./sys-check.interfaces";


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
      if (paramId === this.bs.basicTestConfig.id) {
        this.loadTestConfig();
      } else {
        this.bs.getCheckConfigData(paramId).subscribe(config => this.loadTestConfig(config));
      }
    });
  }

  loadTestConfig(checkConfig: CheckConfigData = null) {
    if (checkConfig) {
      this.ds.checkConfig$.next(checkConfig);
    } else {
      checkConfig = this.ds.checkConfig$.getValue();
    }

    this.title = checkConfig.label;
    this.checks.unit = checkConfig.hasunit;
    this.checks.network = !checkConfig.skipnetwork;
    this.checks.questions = checkConfig.questions.length > 0;
    this.checks.report = checkConfig.cansave;

    if (this.checks.unit) { this.ds.taskQueue.push('loadunit'); }
    if (this.checks.network) { this.ds.taskQueue.push('speedtest'); }
    this.ds.nextTask();
  }
}
