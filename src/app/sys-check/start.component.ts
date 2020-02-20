import { SysCheckDataService } from './sys-check-data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { BackendService } from './backend.service';
import { Component, OnInit, SkipSelf } from '@angular/core';
import { CheckConfig } from './sys-check.interfaces';
import { CustomtextService } from 'iqb-components';



@Component({
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})

export class StartComponent implements OnInit {
  checkConfigList: CheckConfig[] = [];
  public dataLoading = false;

  constructor(
    private bs: BackendService,
    private ds: SysCheckDataService,
    private route: ActivatedRoute,
    private router: Router,
    @SkipSelf() public cts: CustomtextService) { }

  ngOnInit() {
    this.dataLoading = true;
    this.bs.getCheckConfigs().subscribe(myConfigs => {
      this.checkConfigList = myConfigs;
      this.dataLoading = false;
    });
  }

  buttonStartCheck(c: CheckConfig) {
    this.router.navigate(['../run/' + c.id], {relativeTo: this.route});
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
