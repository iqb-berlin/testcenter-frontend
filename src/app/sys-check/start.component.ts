import { Router, ActivatedRoute } from '@angular/router';
import { BackendService, CheckConfig } from './backend.service';
import { Component, OnInit } from '@angular/core';



@Component({
  templateUrl: './start.component.html',
  styles: ['p.check_title { font-size: 16pt; margin-bottom: 0px; height: 24px}',
    'p.check_descr { font-size: 9pt; margin-top: 0px; color: darkblue; height: 24px; margin-bottom: 18px}',
    '.mat-card { margin: 10px }']
})
export class StartComponent implements OnInit {
  checkConfigList: CheckConfig[] = [];
  private dataLoading = false;

  constructor(
    private bs: BackendService,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit() {
    this.dataLoading = true;
    this.bs.getCheckConfigs().subscribe(myConfigs => {
      this.checkConfigList = myConfigs;
      this.checkConfigList.push(
        {
          id: 'Basistest',
          label: 'Basistest',
          description: 'Es wird nur ein Bericht zu grundlegenden Systemeigenschaften und zur Netzverbindung gegeben.'
        }
      );
      this.dataLoading = false;
    });
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  buttonStartCheck(c: CheckConfig) {
    this.router.navigate(['../checkrun/' + c.id], {relativeTo: this.route});
  }
}
