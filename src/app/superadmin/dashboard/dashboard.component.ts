import { MainDatastoreService } from './../../admin/maindatastore.service';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'superadmin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public isSuperadmin = false;

  constructor(private mds: MainDatastoreService) {
    this.mds.isSuperadmin$.subscribe(
      is => this.isSuperadmin = is);
  }

  ngOnInit() {

  }

}
