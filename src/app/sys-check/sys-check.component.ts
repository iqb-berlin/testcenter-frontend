import { SysCheckDataService } from './sys-check-data.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import {Component, OnDestroy, OnInit} from '@angular/core';
import { BackendService } from './backend.service';
import { Subscription } from 'rxjs';
import { CustomtextService } from 'iqb-components';
import {MainDataService} from "../maindata.service";

@Component({
  templateUrl: './sys-check.component.html',
  styleUrls: ['./sys-check.component.scss']
})

export class SysCheckComponent implements OnInit, OnDestroy {
  private taskSubscription: Subscription = null;

  loading = false;
  unitCheck = false;
  questions = false;
  networkCheck = false;
  reportEnabled = false;
  isError = false;

  title = 'Lade - bitte warten';

  constructor(
    private bs: BackendService,
    private ds: SysCheckDataService,
    private route: ActivatedRoute,
    private mds: MainDataService,
    private cts: CustomtextService
  ) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {

      const sysCheckName = params.get('sys-check-name');
      const workspaceId = parseInt(params.get('workspace-id'));
      setTimeout(() => {
        this.loading = true;
        this.bs.getCheckConfigData(workspaceId, sysCheckName).subscribe(checkConfig => {
          this.ds.checkConfig$.next(checkConfig);
          if (checkConfig) {
            this.title = checkConfig.label;
            this.unitCheck = checkConfig.hasUnit;
            this.networkCheck = !checkConfig.skipNetwork;
            this.questions = checkConfig.questions.length > 0;
            this.reportEnabled = checkConfig.canSave;

            if (this.unitCheck) {
              this.ds.taskQueue.push('loadunit');
            }
            if (this.networkCheck) {
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
              this.loading = (typeof task !== 'undefined') && (this.ds.taskQueue.length > 0);
            });
            this.isError = false;
          } else {
            this.title = 'Fehler beim Laden der Daten für den System-Check';
            this.loading = false;
            this.isError = true;
          }
        });
      })
    });
  }

  ngOnDestroy() {
    if (this.taskSubscription !== null) {
      this.taskSubscription.unsubscribe();
    }
  }
}
