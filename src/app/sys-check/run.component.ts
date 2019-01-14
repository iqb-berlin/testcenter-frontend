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
  @ViewChild('compEnv') compEnv: EnvironmentCheckComponent;
  @ViewChild('stepNetwork') stepNetwork: MatStep;
  @ViewChild('compNetwork') compNetwork: NetworkCheckComponent;
  @ViewChild('stepUnit') stepUnit: MatStep;
  @ViewChild('compUnit') compUnit: UnitCheckComponent;

  paramId: string;
  unitcheckAvailable = false;
  questionnaireAvailable = false;
  emailEnabled = false;


  constructor(
    private bs: BackendService,
    private ds: SyscheckDataService,
    private route: ActivatedRoute,
    private saveDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.ds.unitcheckAvailable$.subscribe(is => this.unitcheckAvailable = is);
    this.ds.questionnaireAvailable$.subscribe(is => this.questionnaireAvailable = is);
    this.ds.networkData$.subscribe(nd => {
      this.stepNetwork.completed = nd.length > 0;
    });

    this.stepper.linear = true;
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.paramId = params.get('c');
      if (this.paramId === this.bs.basicTestConfig.id) {
        this.ds.checkConfig$.next(this.bs.basicTestConfigData);
        this.stepper.selectedIndex = 0;
        this.stepNetwork.completed = false;
      } else {
        this.bs.getCheckConfigData(this.paramId).subscribe(
          scData => {
            if (typeof scData.downloadGood === 'undefined') {
              scData.downloadGood = this.bs.basicTestConfigData.downloadGood;
            }
            if (typeof scData.downloadMinimum === 'undefined') {
              scData.downloadMinimum = this.bs.basicTestConfigData.downloadMinimum;
            }
            if (typeof scData.uploadGood === 'undefined') {
              scData.uploadGood = this.bs.basicTestConfigData.uploadGood;
            }
            if (typeof scData.uploadMinimum === 'undefined') {
              scData.uploadMinimum = this.bs.basicTestConfigData.uploadMinimum;
            }
            if (typeof scData.pingGood === 'undefined') {
              scData.pingGood = this.bs.basicTestConfigData.pingGood;
            }
            if (typeof scData.pingMinimum === 'undefined') {
              scData.pingMinimum = this.bs.basicTestConfigData.pingMinimum;
            }

            this.ds.checkConfig$.next(scData);
            this.stepper.selectedIndex = 0;
            this.stepNetwork.completed = false;
          }
        );
      }
    });
  }

  stepperSelectionChanged(e) {
    this.ds.setPageTitle();

    if (e.selectedStep === this.stepUnit) {
      if (!this.stepUnit.completed) {
        const cd = this.ds.checkConfig$.getValue();
        this.compUnit.loadUnit(cd.unit);
        this.stepUnit.completed = true;
      }
    } else if (e.selectedStep === this.stepNetwork) {
      if (!this.stepNetwork.completed) {
        // this.compNetwork.startCheck();
        this.stepNetwork.completed = true;
      }
    }

  }

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
