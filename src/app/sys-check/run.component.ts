import { SyscheckDataService } from './syscheck-data.service';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CheckConfigData, BackendService } from './backend.service';


@Component({
  selector: 'app-run',
  templateUrl: './run.component.html',
  styleUrls: ['./run.component.css']
})
export class RunComponent implements OnInit {
  myCheckConfig$ = new BehaviorSubject<CheckConfigData>(null);
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
    // this.ds.unitcheckAvailable$.subscribe(is => this.unitcheckAvailable = is);
    // this.ds.questionnaireAvailable$.subscribe(is => this.questionnaireAvailable = is);

    this.route.paramMap.subscribe((params: ParamMap) => {
      this.paramId = params.get('c');
      this.bs.getCheckConfigData(params.get('c')).subscribe(
        scData => {
          this.myCheckConfig$.next(scData);
        });
    });
  }
}
