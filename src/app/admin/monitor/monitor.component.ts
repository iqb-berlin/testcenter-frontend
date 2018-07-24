import { BackendService, BookletlistResponseData, ServerError } from './../backend/backend.service';
import { MainDatastoreService } from './../maindatastore.service';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatSnackBar, MatSort } from '@angular/material';
import { Observable, throwError } from 'rxjs';

@Component({
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.css']
})
export class MonitorComponent implements OnInit {
  private isAdmin = false;
  private booklets:  BookletlistResponseData[];

  @ViewChild(MatSort) sort: MatSort;

  // Methods
  constructor(@Inject('SERVER_URL') private serverUrl: string,
    private bs: BackendService,
    private mds: MainDatastoreService,
    public snackBar: MatSnackBar
  ) {
    this.booklets = [];
    this.mds.isAdmin$.subscribe(
      i => this.isAdmin = i);
  }

  ngOnInit() {
    this.mds.workspaceId$.subscribe(ws => {
      this.updateBookletList();
    });
  }

  // ***********************************************************************************
  updateBookletList() {
    if (this.isAdmin) {
      const myWorkspaceId = this.mds.workspaceId$.getValue();
      if (myWorkspaceId < 0) {
        this.booklets = [];
      } else {
        this.bs.getBookletlist(this.mds.adminToken$.getValue(), myWorkspaceId).subscribe(
          (dataresponse: BookletlistResponseData[]) => {
            this.booklets = dataresponse;
          }, (err: ServerError) => {
            this.mds.updateAdminStatus('', '', [], false, err.label);
          }
        );
      }
    } else {
      this.booklets = [];
    }
  }

}
