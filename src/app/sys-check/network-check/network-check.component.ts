import { SyscheckDataService, NetworkData } from './../syscheck-data.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'iqb-network-check',
  templateUrl: './network-check.component.html',
  styleUrls: ['./network-check.component.css']
})
export class NetworkCheckComponent implements OnInit {
  firstCall = true;

  constructor(
    private ds: SyscheckDataService
  ) { }

  ngOnInit() {

  }

  public startCheck() {
    const nwdBefore = this.ds.networkData$.getValue();
    const nwd: NetworkData = {speedindicator: (nwdBefore === null ? 1 : nwdBefore.speedindicator + 1)};
    console.log('started');
    this.ds.networkData$.next(nwd);
    this.firstCall = false;
  }

}
