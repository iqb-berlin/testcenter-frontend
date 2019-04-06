import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'superadmin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public isSuperadmin = false;

  constructor() {
  }

  ngOnInit() {

  }

}
