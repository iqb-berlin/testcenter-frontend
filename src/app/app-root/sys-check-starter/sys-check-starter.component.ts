import {Component, OnInit} from '@angular/core';
import {BackendService} from "../../backend.service";
import {Router} from "@angular/router";
import {MainDataService} from "../../maindata.service";
import {SysCheckInfo} from "../../app.interfaces";
import {CustomtextService} from "iqb-components";

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

  ngOnInit() {
    setTimeout(() => {
      this.loading = true;
      this.bs.getSysCheckInfo().subscribe(myConfigs => {
        if (myConfigs) {
          this.checkConfigList = myConfigs;
        } else {
          this.checkConfigList = [
            {
              workspaceId: "20",
              name: "UjjUUjj",
              label: "Machbarkeit 2020",
              description: "sijdsidjsi"
            },
            {
              workspaceId: "20",
              name: "Ikkdie",
              label: "jojojojojojo",
              description: "sijdsidjsi"
            }
          ]
        }
        this.loading = false;
      });
    })
  }

  buttonStartCheck(checkInfo: SysCheckInfo) {
    this.router.navigate([`/check/${checkInfo.workspaceId}/${checkInfo.name}`]);
  }
}
