import { MainDatastoreService } from './../maindatastore.service';
import { ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType } from '../../iqb-common';
import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material';
import { BackendService, GetFileResponseData, CheckWorkspaceResponseData, ServerError } from '../backend/backend.service';
import { Input, Output, EventEmitter, Component, OnInit, Inject, ElementRef } from '@angular/core';
import { NgModule, ViewChild } from '@angular/core';
import { MatSort, MatDialog } from '@angular/material';
import { HttpEventType, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { IqbFilesUploadQueueComponent, IqbFilesUploadInputForDirective } from '../../iqb-files';


@Component({
  templateUrl: './myfiles.component.html',
  styleUrls: ['./myfiles.component.css']
})
export class MyfilesComponent implements OnInit {
  public serverfiles: MatTableDataSource<GetFileResponseData>;
  public displayedColumns = ['checked', 'filename', 'typelabel', 'filesize', 'filedatetime'];
  public uploadUrl = 'uploadFile.php';
  public fileNameAlias = 'fileforvo';
  public dataLoading = false;

  // for iqb-FileUpload
  private isAdmin = false;
  public token = '';
  public workspace = -1;

  // for workspace-check
  public checkErrors = [];
  public checkWarnings = [];
  public checkInfos = [];

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private bs: BackendService,
    private mds: MainDatastoreService,
    public confirmDialog: MatDialog,
    public messsageDialog: MatDialog,
    public snackBar: MatSnackBar
  ) {
    this.mds.isAdmin$.subscribe(i => {
      this.isAdmin = i;
    });
    this.uploadUrl = this.serverUrl + 'admin/uploadFile.php';
  }

  ngOnInit() {
    this.mds.workspaceId$.subscribe(ws => {
      this.updateFileList();
      this.workspace = ws;
    });
    this.mds.adminToken$.subscribe(token => this.token = token);
  }

  // ***********************************************************************************
  checkAll(isChecked: boolean) {
    this.serverfiles.data.forEach(element => {
      element.isChecked = isChecked;
    });
  }

  // ***********************************************************************************
  deleteFiles() {
    this.checkErrors = [];
    this.checkWarnings = [];
    this.checkInfos = [];

    const filesToDelete = [];
    this.serverfiles.data.forEach(element => {
      if (element.isChecked) {
        filesToDelete.push(element.type + '::' + element.filename);
      }
    });

    if (filesToDelete.length > 0) {
      let prompt = 'Sie haben ';
      if (filesToDelete.length > 1) {
        prompt = prompt + filesToDelete.length + ' Dateien ausgewählt. Sollen';
      } else {
        prompt = prompt + ' eine Datei ausgewählt. Soll';
      }
      const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Dateien',
          content: prompt + ' diese gelöscht werden?',
          confirmbuttonlabel: 'Löschen'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          // =========================================================
          this.dataLoading = true;
          this.bs.deleteFiles(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue(), filesToDelete).subscribe(
            (deletefilesresponse: string) => {
              if ((deletefilesresponse.length > 5) && (deletefilesresponse.substr(0, 2) === 'e:')) {
                this.snackBar.open(deletefilesresponse.substr(2), 'Fehler', {duration: 1000});
              } else {
                this.snackBar.open(deletefilesresponse, '', {duration: 1000});
                this.updateFileList();
              }
            }, (err: ServerError) => {
              this.mds.updateAdminStatus('', '', [], false, err.label);
            });
          // =========================================================
        }
      });
    } else {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Löschen von Dateien',
          content: 'Bitte markieren Sie erst Dateien!',
          type: MessageType.error
        }
      });
    }

  }

  // ***********************************************************************************
  updateFileList() {
    this.checkErrors = [];
    this.checkWarnings = [];
    this.checkInfos = [];

    if (this.isAdmin) {
      const myWorkspaceId = this.mds.workspaceId$.getValue();
      if (myWorkspaceId < 0) {
        this.serverfiles = null;
        this.dataLoading = false;
      } else {
        this.dataLoading = true;
        this.bs.getFiles(this.mds.adminToken$.getValue(), myWorkspaceId).subscribe(
          (filedataresponse: GetFileResponseData[]) => {
            this.serverfiles = new MatTableDataSource(filedataresponse);
            this.serverfiles.sort = this.sort;
            this.dataLoading = false;
          }, (err: ServerError) => {
            this.mds.updateAdminStatus('', '', [], false, err.label);
            this.dataLoading = false;
          }
        );
      }
    } else {
      this.serverfiles = null;
      this.dataLoading = false;
    }
  }

  // ***********************************************************************************
  getDownloadRef(element: GetFileResponseData): string {
    return this.serverUrl
        + 'getFile.php?at=' + this.mds.adminToken$.getValue()
        + '&ws=' + this.mds.workspaceId$.getValue()
        + '&t=' + element.type
        + '&fn=' + element.filename;
  }

  checkWorkspace() {
    this.checkErrors = [];
    this.checkWarnings = [];
    this.checkInfos = [];

    if (this.isAdmin) {
      const myWorkspaceId = this.mds.workspaceId$.getValue();
      if (myWorkspaceId < 0) {
        // this.serverfiles = null;
        this.dataLoading = false;
      } else {
        this.dataLoading = true;
        this.bs.checkWorkspace(this.mds.adminToken$.getValue(), myWorkspaceId).subscribe(
          (checkResponse: CheckWorkspaceResponseData) => {
            // this.serverfiles = new MatTableDataSource(filedataresponse);
            // this.serverfiles.sort = this.sort;
            this.checkErrors = checkResponse.errors;
            this.checkWarnings = checkResponse.warnings;
            this.checkInfos = checkResponse.infos;

            this.dataLoading = false;
          }, (err: ServerError) => {
            this.mds.updateAdminStatus('', '', [], false, err.label);
            this.dataLoading = false;
          }
        );
      }
    } else {
      // this.serverfiles = null;
      this.dataLoading = false;
    }
  }
}
