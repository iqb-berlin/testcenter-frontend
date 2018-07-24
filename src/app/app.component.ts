import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { FormGroup } from '@angular/forms';

import { LoginStatusResponseData } from './admin/backend/backend.service';
import { MainDatastoreService } from './admin';
import { IqbCommonModule, ConfirmDialogComponent, ConfirmDialogData } from './iqb-common';
import { AboutDialogComponent } from './about-dialog/about-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
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
  showAboutDialog() {
    const dialogRef = this.aboutDialog.open(AboutDialogComponent, {
      width: '500px',
      data: {
        status: this.mds.isAdmin$.getValue() ? ('angemeldet als ' + this.mds.loginName$.getValue()) : 'nicht angemeldet',
        workspace: this.mds.isAdmin$.getValue() ? this.mds.myWorkspaceName : '-'
      }
    });
  }

  // *******************************************************************************************************
  login() {
    this.mds.login_dialog();
  }

  // *******************************************************************************************************
  logout() {
    this.mds.logout();
  }

}
