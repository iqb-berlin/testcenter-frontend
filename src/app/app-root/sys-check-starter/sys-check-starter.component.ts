import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomtextService } from 'iqb-components';
import { BackendService } from '../../backend.service';
import { MainDataService } from '../../maindata.service';
import { SysCheckInfo } from '../../app.interfaces';

@Component({
  templateUrl: './sys-check-starter.component.html',
  styleUrls: ['./sys-check-starter.component.css']
})
export class SysCheckStarterComponent implements OnInit {
  checkConfigList: SysCheckInfo[] = [];
  loading = false;

  constructor(
    public mds: MainDataService,
    private bs: BackendService,
    public cts: CustomtextService,
    private router: Router
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.loading = true;
      this.mds.setSpinnerOn();
      this.bs.getSysCheckInfo().subscribe(myConfigs => {
        if (myConfigs) {
          this.checkConfigList = myConfigs;
        } else {
          this.checkConfigList = [];
        }
        this.loading = false;
        this.mds.setSpinnerOff();
      });
    });
  }

  buttonStartCheck(checkInfo: SysCheckInfo): void {
    this.router.navigate([`/check/${checkInfo.workspaceId}/${checkInfo.name}`]);
  }
}
