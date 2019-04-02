import { MainDataService } from './../maindata.service';
// import { Observable } from 'rxjs/Observable';
// import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BehaviorSubject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { Injectable, Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

import { IqbCommonModule, ConfirmDialogComponent, ConfirmDialogData } from '../iqb-common';
import { BackendService } from './backend.service';
import { WorkspaceData } from '../app.interfaces';
import { ServerError } from '../backend.service';

@Injectable({
  providedIn: 'root'
})

export class WorkspaceDataService {
  public workspaceId$ = new BehaviorSubject<number>(-1);
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);

  private _wsName : string;
  public get wsName() : string {
    return this._wsName;
  }

  private _wsRole : string;
  public get wsRole() : string {
    return this._wsRole;
  }


  // ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
  constructor (
    public confirmDialog: MatDialog,
    private bs: BackendService,
    private mds: MainDataService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  setNewErrorMsg(err: ServerError = null) {
    this.globalErrorMsg$.next(err);
  }

  // *******************************************************************************************************
  logout() {
    // const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
    //   width: '400px',
    //   height: '300px',
    //   data:  <ConfirmDialogData>{
    //     title: 'Abmelden',
    //     content: 'Möchten Sie sich abmelden?',
    //     confirmbuttonlabel: 'Abmelden'
    //   }
    // });
    // dialogRef.afterClosed().subscribe(result => {
    //   if (result !== false) {
    //     this.bs.logout(this.adminToken$.getValue()).subscribe(
    //       logoutresponse => {
    //         this.updateAdminStatus('', '', [], false, '');
    //         this.router.navigateByUrl('/');
    //       }, (err: ServerError) => {
    //         this.updateAdminStatus('', '', [], false, err.label);
    //         this.router.navigateByUrl('/');
    //       }
    //     );
    //   }
    // });
  }

  // *******************************************************************************************************
  setWorkspaceId(newId: number) {
    this.workspaceId$.next(newId);
    this._wsName = this.mds.getWorkspaceName(newId);
    this._wsRole = this.mds.getWorkspaceRole(newId);
  }
}
