import { MainDataService } from '../../maindata.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { GetFileResponseData, CheckWorkspaceResponseData } from '../workspace.interfaces';
import { ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType, ServerError } from 'iqb-components';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import {BackendService, FileDeletionReport} from '../backend.service';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { saveAs } from 'file-saver';

@Component({
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})
export class FilesComponent implements OnInit, OnDestroy {
  public serverfiles: MatTableDataSource<GetFileResponseData>;
  public displayedColumns = ['checked', 'filename', 'typelabel', 'filesize', 'filedatetime'];
  public dataLoading = false;
  private workspaceIdSubscription: Subscription = null;

  // for fileupload
  public uploadUrl = '';
  public fileNameAlias = 'fileforvo';

  // for workspace-check
  public checkErrors = [];
  public checkWarnings = [];
  public checkInfos = [];

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private bs: BackendService,
    private mds: MainDataService,
    public wds: WorkspaceDataService,
    public confirmDialog: MatDialog,
    public messsageDialog: MatDialog,
    public snackBar: MatSnackBar
  ) {
    this.wds.workspaceId$.subscribe(workspaceId => {
      this.uploadUrl = this.serverUrl + `workspace/${workspaceId}/file`;
    });
    this.uploadUrl = this.serverUrl + this.wds.ws + '/file';
  }

  ngOnInit() {
    this.workspaceIdSubscription = this.wds.workspaceId$.subscribe(() => {
      this.updateFileList((this.wds.ws <= 0) || (this.mds.adminToken.length === 0));
    });
  }

  // ***********************************************************************************
  checkAll(isChecked: boolean) {
    this.serverfiles.data.forEach(element => {
      element.isChecked = isChecked;
    });
  }

  // ***********************************************************************************
  deleteFiles() {
    if (this.wds.wsRole === 'RW') {
      this.checkErrors = [];
      this.checkWarnings = [];
      this.checkInfos = [];

      const filesToDelete = [];
      this.serverfiles.data.forEach(element => {
        if (element.isChecked) {
          filesToDelete.push(element.type + '/' + element.filename);
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
            confirmbuttonlabel: 'Löschen',
            showcancel: true
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result !== false) {
            // =========================================================
            this.dataLoading = true;
            this.bs.deleteFiles(this.wds.ws, filesToDelete).subscribe((fileDeletionReport: FileDeletionReport|ServerError) => {
              if (fileDeletionReport instanceof ServerError) {
                this.wds.setNewErrorMsg(fileDeletionReport as ServerError);
              } else {

                const message = [];
                if (fileDeletionReport.deleted.length > 0) {
                  message.push(fileDeletionReport.deleted.length + ' Dateien erfolgreich gelöscht.');
                }
                if (fileDeletionReport.not_allowed.length > 0) {
                  message.push(fileDeletionReport.not_allowed.length + ' Dateien konnten nicht gelöscht werden.');
                }

                this.snackBar.open(message.join('<br>'), message.length > 1 ? 'Achtung' : '',  {duration: 1000});

                this.updateFileList();
                this.wds.setNewErrorMsg();
              }
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
  }

  // ***********************************************************************************
  updateFileList(empty = false) {
    this.checkErrors = [];
    this.checkWarnings = [];
    this.checkInfos = [];

    if (empty || this.wds.wsRole === 'MO') {
      this.serverfiles = new MatTableDataSource([]);
    } else {
      this.dataLoading = true;
      this.bs.getFiles(this.wds.ws).subscribe(
        (filedataresponse: GetFileResponseData[]) => {
          this.serverfiles = new MatTableDataSource(filedataresponse);
          this.serverfiles.sort = this.sort;
          this.dataLoading = false;
          this.wds.setNewErrorMsg();
        }, (err: ServerError) => {
          this.wds.setNewErrorMsg(err);
          this.dataLoading = false;
        }
      );
    }
  }


  download(element: GetFileResponseData): void {

    this.dataLoading = true;
    this.bs.downloadFile(this.wds.ws, element.type, element.filename)
      .subscribe(
        (fileData: Blob|ServerError) => {
          if (fileData instanceof ServerError) {
            this.wds.setNewErrorMsg(fileData);
            this.dataLoading = false;
          } else {
            saveAs(fileData, element.filename);
            this.wds.setNewErrorMsg();
            this.dataLoading = false;
          }
        }
      );
  }


  checkWorkspace() {
    this.checkErrors = [];
    this.checkWarnings = [];
    this.checkInfos = [];

    this.dataLoading = true;
    this.bs.checkWorkspace(this.wds.ws).subscribe(
      (checkResponse: CheckWorkspaceResponseData) => {
        this.checkErrors = checkResponse.errors;
        this.checkWarnings = checkResponse.warnings;
        this.checkInfos = checkResponse.infos;
        this.wds.setNewErrorMsg();

        this.dataLoading = false;
      }, (err: ServerError) => {
        this.wds.setNewErrorMsg(err);
        this.dataLoading = false;
      }
    );
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.workspaceIdSubscription !== null) {
      this.workspaceIdSubscription.unsubscribe();
    }
  }
}
