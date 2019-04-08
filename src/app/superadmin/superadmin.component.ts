import { Component, OnInit } from '@angular/core';
import { MainDataService } from '../maindata.service';



@Component({
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent {
  constructor(
    public mds: MainDataService
  ) { }

  public navLinks = [
    {path: 'users', label: 'Users'},
    {path: 'workspaces', label: 'Arbeitsbereiche'}
  ];
}
