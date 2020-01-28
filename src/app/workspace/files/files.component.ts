import { MainDataService } from '../../maindata.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { GetFileResponseData, CheckWorkspaceResponseData } from '../workspace.interfaces';
import { ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType, ServerError } from "iqb-components";
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BackendService } from '../backend.service';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';

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
    this.uploadUrl = this.serverUrl + 'php/uploadFile.php';
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
            confirmbuttonlabel: 'Löschen',
            showcancel: true
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result !== false) {
            // =========================================================
            this.dataLoading = true;
            this.bs.deleteFiles(filesToDelete).subscribe(deletefilesresponse => {
              if (deletefilesresponse instanceof ServerError) {
                this.wds.setNewErrorMsg(deletefilesresponse as ServerError);
              } else {
                const deletefilesresponseOk = deletefilesresponse as string;
                if ((deletefilesresponseOk.length > 5) && (deletefilesresponseOk.substr(0, 2) === 'e:')) {
                  this.snackBar.open(deletefilesresponseOk.substr(2), 'Fehler', {duration: 1000});
                } else {
                  this.snackBar.open(deletefilesresponseOk, '', {duration: 1000});
                  this.updateFileList();
                }
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
      this.bs.getFiles().subscribe(
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

  // ***********************************************************************************
  getDownloadRef(element: GetFileResponseData): string {
    return this.serverUrl
        + 'php/getFile.php?t=' + element.type
        + '&fn=' + element.filename
        + '&at=' + this.mds.adminToken
        + '&ws=' + this.wds.ws.toString();
  }

  checkWorkspace() {
    this.checkErrors = [];
    this.checkWarnings = [];
    this.checkInfos = [];

    this.dataLoading = true;
    this.bs.checkWorkspace().subscribe(
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
