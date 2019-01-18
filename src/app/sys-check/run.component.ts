import { element } from 'protractor';
import { SaveReportComponent } from './report/save-report/save-report.component';
import { NetworkCheckComponent } from './network-check/network-check.component';
import { SyscheckDataService } from './syscheck-data.service';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CheckConfigData, BackendService } from './backend.service';
import { MatStepper, MatStep } from '../../../node_modules/@angular/material';
import { UnitCheckComponent } from './unit-check/unit-check.component';
import { EnvironmentCheckComponent } from './environment-check/environment-check.component';
import { MatDialog, MatSnackBar } from '@angular/material';


@Component({
  selector: 'app-run',
  templateUrl: './run.component.html',
  styleUrls: ['./run.component.css']
})
export class RunComponent implements OnInit {
  @ViewChild('stepper') stepper: MatStepper;
  @ViewChild('stepEnv') stepEnv: MatStep;
  @ViewChild('stepNetwork') stepNetwork: MatStep;
  @ViewChild('compNetwork') compNetwork: NetworkCheckComponent;
  @ViewChild('stepUnit') stepUnit: MatStep;
  @ViewChild('compUnit') compUnit: UnitCheckComponent;

  paramId: string;
  unitcheckAvailable = false;
  questionnaireAvailable = false;
  saveEnabled = false;
  questionsonlymode = false;
  skipnetwork = false;


  constructor(
    private bs: BackendService,
    private ds: SyscheckDataService,
    private route: ActivatedRoute,
    private saveDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.ds.networkData$.subscribe(nd => {
      if (typeof this.stepNetwork !== 'undefined') {
        this.stepNetwork.completed = nd.length > 0;
      }
    });

    this.stepper.linear = true;
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.paramId = params.get('c');
      if (this.paramId === this.bs.basicTestConfig.id) {
        this.ds.checkConfig$.next(this.bs.basicTestConfigData);
        this.stepper.selectedIndex = 0;
        if (typeof this.stepNetwork !== 'undefined') {
          this.stepNetwork.completed = false;
        }
        this.unitcheckAvailable = false;
        this.questionnaireAvailable = false;
        this.questionsonlymode = false;
        this.skipnetwork = false;
      } else {
        this.bs.getCheckConfigData(this.paramId).subscribe(
          scData => {
            scData.downloadGood = this.bs.basicTestConfigData.downloadGood;
            scData.downloadMinimum = this.bs.basicTestConfigData.downloadMinimum;
            scData.uploadGood = this.bs.basicTestConfigData.uploadGood;
            scData.uploadMinimum = this.bs.basicTestConfigData.uploadMinimum;
            scData.pingGood = this.bs.basicTestConfigData.pingGood;
            scData.pingMinimum = this.bs.basicTestConfigData.pingMinimum;

            if (typeof scData.ratings !== 'undefined') {
              for (let i = 0; i < scData.ratings.length; i++) {
                if (scData.ratings[i].type === 'download') {
                  scData.downloadGood = scData.ratings[i].good;
                  scData.downloadMinimum = scData.ratings[i].min;
                } else if (scData.ratings[i].type === 'upload') {
                  scData.uploadGood = scData.ratings[i].good;
                  scData.uploadMinimum = scData.ratings[i].min;
                } else if (scData.ratings[i].type === 'ping') {
                  scData.pingGood = scData.ratings[i].good;
                  scData.pingMinimum = scData.ratings[i].min;
                }
              }
            }

            this.ds.checkConfig$.next(scData);
            this.stepper.selectedIndex = 0;
            this.skipnetwork = scData.skipnetwork;
            if (typeof this.stepNetwork !== 'undefined') {
              this.stepNetwork.completed = this.skipnetwork;
            }
            this.saveEnabled = scData.cansave;
            this.questionsonlymode = scData.questionsonlymode;
            if (this.questionsonlymode) {
              // worst case: step is shown but no questions
              this.questionnaireAvailable = true;
              this.unitcheckAvailable = false;
            } else {
              this.questionnaireAvailable = scData.questions.length > 0;
              this.unitcheckAvailable = scData.hasunit;
            }
          }
        );
      }
    });
  }

  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  stepperSelectionChanged(e) {
    this.ds.setPageTitle();
    this.ds.showNaviButtons$.next(false);

    if (e.selectedStep === this.stepUnit) {
      this.ds.showNaviButtons$.next(true);
      if (!this.stepUnit.completed) {
        const cd = this.ds.checkConfig$.getValue();
        this.compUnit.loadUnit(cd.id);
        this.stepUnit.completed = true;
      }
    } else if (e.selectedStep === this.stepNetwork) {
      if (this.skipnetwork) {
        this.stepNetwork.completed = true;
      } else {
        if (!this.stepNetwork.completed) {
          this.compNetwork.startCheck();
        }
      }
    }

  }

  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  saveReport() {
    const dialogRef = this.saveDialog.open(SaveReportComponent, {
      width: '500px',
      height: '600px',
      data: 'jojo'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== false) {
        this.snackBar.open('Bericht gespeichert.', '', {duration: 3000});
      }
    });
  }
}
