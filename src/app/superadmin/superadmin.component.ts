import { Component, OnInit } from '@angular/core';
import { MainDataService } from '../maindata.service';

@Component({
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent implements OnInit {
  constructor(
    public mds: MainDataService
  ) { }

  navLinks = [
    { path: 'users', label: 'Users' },
    { path: 'workspaces', label: 'Arbeitsbereiche' }
  ];

  ngOnInit():void {
    setTimeout(() => this.mds.appSubTitle$.next('Systemverwaltung'));
  }
}
