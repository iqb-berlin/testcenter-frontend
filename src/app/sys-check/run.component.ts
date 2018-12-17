import { NetworkCheckComponent } from './network-check/network-check.component';
import { SyscheckDataService } from './syscheck-data.service';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CheckConfigData, BackendService } from './backend.service';
import { MatStepper, MatStep } from '../../../node_modules/@angular/material';
import { UnitCheckComponent } from './unit-check/unit-check.component';


@Component({
  selector: 'app-run',
  templateUrl: './run.component.html',
  styleUrls: ['./run.component.css']
})
export class RunComponent implements OnInit {
  @ViewChild('stepper') stepper: MatStepper;
  @ViewChild('stepNetwork') stepNetwork: MatStep;
  @ViewChild('stepUnit') stepUnit: MatStep;
  @ViewChild('compNetwork') compNetwork: NetworkCheckComponent;
  @ViewChild('compUnit') compUnit: UnitCheckComponent;

  paramId: string;

  unitcheckAvailable = false;
  questionnaireAvailable = false;

  constructor(
    private bs: BackendService,
    private ds: SyscheckDataService,
    private route: ActivatedRoute
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
            this.ds.checkConfig$.next(scData);
            this.stepper.selectedIndex = 0;
            this.stepNetwork.completed = false;
          }
        );
      }
    });
  }

  stepperSelectionChanged(e) {
    if (e.selectedStep === this.stepUnit) {
      if (!this.stepUnit.completed) {
        const cd = this.ds.checkConfig$.getValue();
        this.compUnit.loadUnit(cd.unit);
        this.stepUnit.completed = true;
      }
    } else if (e.selectedStep === this.stepNetwork) {
      if (!this.stepNetwork.completed) {
        this.compNetwork.startCheck();
        this.stepNetwork.completed = true;
      }
    }

  }
}
