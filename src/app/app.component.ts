import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { FormGroup } from '@angular/forms';

import { LoginStatusResponseData } from './admin/backend.service';
import { MainDatastoreService } from './admin';
import { IqbCommonModule, ConfirmDialogComponent, ConfirmDialogData } from './iqb-common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit {
  public title = '';
  public isLoggedIn = false;
  public isSuperadmin = false;

  constructor (
    private mds: MainDatastoreService,
    private router: Router,
    public aboutDialog: MatDialog) { }

  ngOnInit() {
    this.mds.isAdmin$.subscribe(
      is => this.isLoggedIn = is);

    this.mds.pageTitle$.subscribe(
      t => this.title = t);

    this.mds.isSuperadmin$.subscribe(
      is => this.isSuperadmin = is);

  }


  // *******************************************************************************************************
  logout() {
    this.mds.logout();
  }

}
