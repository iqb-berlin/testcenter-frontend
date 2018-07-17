import { environment } from './../environments/environment';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { FormGroup } from '@angular/forms';

import { LoginStatusResponseData } from './admin/backend/backend.service';
import { StatusService } from './admin';
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

  constructor (
    private ass: StatusService,
    private router: Router,
    public aboutDialog: MatDialog) { }

  ngOnInit() {
    this.ass.isAdmin$.subscribe(
      is => this.isLoggedIn = is);

    this.ass.pageTitle$.subscribe(
      t => {
        this.title = t;
      }
    );
  }

  // *******************************************************************************************************
  showAboutDialog() {
    const dialogRef = this.aboutDialog.open(AboutDialogComponent, {
      width: '500px',
      data: {
        status: this.ass.isAdmin$.getValue() ? ('angemeldet als ' + this.ass.loginName$.getValue()) : 'nicht angemeldet',
        workspace: this.ass.isAdmin$.getValue() ? this.ass.myWorkspaceName : '-'
      }
    });
  }

  // *******************************************************************************************************
  login() {
    this.ass.login_dialog();
  }

  // *******************************************************************************************************
  logout() {
    this.ass.logout();
  }

}
