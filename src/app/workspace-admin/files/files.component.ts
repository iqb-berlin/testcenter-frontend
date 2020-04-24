import { WorkspaceDataService } from '../workspacedata.service';
import { GetFileResponseData, CheckWorkspaceResponseData } from '../workspace.interfaces';
import { ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType } from 'iqb-components';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import {BackendService, FileDeletionReport} from '../backend.service';
import { Component, OnInit, Inject } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { saveAs } from 'file-saver';
import {MainDataService} from "../../maindata.service";

@Component({
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})
export class FilesComponent implements OnInit {
  public serverfiles: MatTableDataSource<GetFileResponseData>;
  public displayedColumns = ['checked', 'filename', 'typelabel', 'filesize', 'filedatetime'];

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
    public wds: WorkspaceDataService,
    public confirmDialog: MatDialog,
    public messageDialog: MatDialog,
    private mds: MainDataService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.uploadUrl = `${this.serverUrl}workspace/${this.wds.wsId}/file`;
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.updateFileList();
    })
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
            this.mds.setSpinnerOn();
            this.bs.deleteFiles(filesToDelete).subscribe((fileDeletionReport: FileDeletionReport) => {
              const message = [];
              if (fileDeletionReport.deleted.length > 0) {
                message.push(fileDeletionReport.deleted.length + ' Dateien erfolgreich gelöscht.');
              }
              if (fileDeletionReport.not_allowed.length > 0) {
                message.push(fileDeletionReport.not_allowed.length + ' Dateien konnten nicht gelöscht werden.');
              }
              this.snackBar.open(message.join('<br>'), message.length > 1 ? 'Achtung' : '',  {duration: 1000});
              this.updateFileList();
            });
            // =========================================================
          }
        });
      } else {
        this.messageDialog.open(MessageDialogComponent, {
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
      this.mds.setSpinnerOff();
    } else {
      this.bs.getFiles().subscribe(
        (fileList: GetFileResponseData[]) => {
          this.serverfiles = new MatTableDataSource(fileList);
          this.serverfiles.sort = this.sort;
          this.mds.setSpinnerOff();
        }
      );
    }
  }

  download(element: GetFileResponseData): void {
    this.mds.setSpinnerOn();
    this.bs.downloadFile(element.type, element.filename)
      .subscribe(
        (fileData: Blob|boolean) => {
          this.mds.setSpinnerOff();
          if (fileData !== false) {
            saveAs(fileData as Blob, element.filename);
          }
        }
      );
  }

  checkWorkspace() {
    this.checkErrors = [];
    this.checkWarnings = [];
    this.checkInfos = [];

    this.mds.setSpinnerOn();
    this.bs.checkWorkspace().subscribe(
      (checkResponse: CheckWorkspaceResponseData) => {
        this.mds.setSpinnerOff();
        this.checkErrors = checkResponse.errors;
        this.checkWarnings = checkResponse.warnings;
        this.checkInfos = checkResponse.infos;
      }
    );
  }
}
