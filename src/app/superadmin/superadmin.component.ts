import { MainDatastoreService } from './../admin/maindatastore.service';
import { Component, OnInit } from '@angular/core';


@Component({
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent implements OnInit {
  public navLinks = [
    {path: 'users', label: 'Users'},
    {path: 'workspaces', label: 'Arbeitsbereiche'}
  ];


  constructor(
    private mds: MainDatastoreService
  ) { }

  ngOnInit() {
    this.mds.updatePageTitle('IQB-Testcenter Verwaltung: Nutzer und Arbeitsbereiche');
  }
}
