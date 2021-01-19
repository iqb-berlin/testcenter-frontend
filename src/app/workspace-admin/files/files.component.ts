import {
  Component, OnInit, Inject, ViewChild
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';

import { saveAs } from 'file-saver';
import {
  ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType
} from 'iqb-components';
import { map } from 'rxjs/operators';
import { WorkspaceDataService } from '../workspacedata.service';
import { GetFileResponseData } from '../workspace.interfaces';
import { BackendService, FileDeletionReport } from '../backend.service';
import { MainDataService } from '../../maindata.service';

interface FileStats {
  types: {
    [type: string]: {
      total: number;
      invalid: number;
    }
  }
  total: number;
  invalid: number;
  testtakers: number;
}

@Component({
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})
export class FilesComponent implements OnInit {
  public serverfiles: MatTableDataSource<GetFileResponseData>;
  public displayedColumns = ['checked', 'name', 'type', 'size', 'modificationTime'];

  // for fileupload
  public uploadUrl = '';
  public fileNameAlias = 'fileforvo';

  public typeLabels = {
    Testtakers: 'Teilnehmerliste',
    Booklet: 'Testheft',
    SysCheck: 'Systemcheck',
    Resource: 'Ressource',
    Unit: 'Unit',
    Player: 'Player'
  };

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public fileStats: FileStats = {
    types: {},
    total: 0,
    invalid: 0,
    testtakers: 0
  };

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    @Inject('VERONA_API_VERSION_SUPPORTED') private veronaApiVersionSupported: string,
    private bs: BackendService,
    public wds: WorkspaceDataService,
    public confirmDialog: MatDialog,
    public messageDialog: MatDialog,
    private mds: MainDataService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.uploadUrl = `${this.serverUrl}workspace/${this.wds.wsId}/file`;
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.updateFileList();
    });
  }

  public checkAll(isChecked: boolean): void {
    this.serverfiles.data.forEach(element => {
      // eslint-disable-next-line no-param-reassign
      element.isChecked = isChecked;
    });
  }

  public deleteFiles(): void {
    if (this.wds.wsRole === 'RW') {
      const filesToDelete = [];
      this.serverfiles.data.forEach(element => {
        if (element.isChecked) {
          filesToDelete.push(`${element.type}/${element.name}`);
        }
      });

      if (filesToDelete.length > 0) {
        const p = filesToDelete.length > 1;
        const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
          width: '400px',
          data: <ConfirmDialogData>{
            title: 'Löschen von Dateien',
            content: `Sie haben ${p ? filesToDelete.length : 'eine'} Datei${p ? 'en' : ''}\` 
              ausgewählt. Soll${p ? 'en' : ''}  diese gelöscht werden?`,
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
                message.push(`${fileDeletionReport.deleted.length} Dateien erfolgreich gelöscht.`);
              }
              if (fileDeletionReport.not_allowed.length > 0) {
                message.push(`${fileDeletionReport.not_allowed.length} Dateien konnten nicht gelöscht werden.`);
              }
              this.snackBar.open(message.join('<br>'), message.length > 1 ? 'Achtung' : '', { duration: 1000 });
              this.updateFileList();
            });
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

  public updateFileList(empty = false): void {
    if (empty) {
      this.serverfiles = new MatTableDataSource([]);
      this.mds.setSpinnerOff();
    } else {
      this.bs.getFiles()
        .pipe(map(fileList => this.addFrontendChecksToFiles(fileList)))
        .subscribe((fileList: GetFileResponseData[]) => {
          this.serverfiles = new MatTableDataSource(fileList);
          this.serverfiles.sort = this.sort;
          this.fileStats = FilesComponent.getStats(fileList);
          this.mds.setSpinnerOff();
        });
    }
  }

  private static getStats(fileList: GetFileResponseData[]): FileStats {
    const stats: FileStats = {
      types: {},
      total: 0,
      invalid: 0,
      testtakers: 0
    };
    fileList.forEach(file => {
      if (typeof stats.types[file.type] === 'undefined') {
        stats.types[file.type] = {
          total: 0,
          invalid: 0
        };
      }
      stats.types[file.type].total += 1;
      stats.total += 1;
      if (file.report.error && file.report.error.length) {
        stats.invalid += 1;
        stats.types[file.type].invalid += 1;
        stats.testtakers += (typeof file.info.testtakers === 'number') ? file.info.testtakers : 0;
      }
    });
    return stats;
  }

  private addFrontendChecksToFiles(fileList: GetFileResponseData[]): GetFileResponseData[] {
    return fileList.map(files => this.addFrontendChecksToFile(files));
  }

  private addFrontendChecksToFile(file: GetFileResponseData): GetFileResponseData {
    if (typeof file.info['verona-version'] !== 'undefined') {
      const fileMayor = file.info['verona-version'].toString().split('.').shift();
      const systemMayor = this.veronaApiVersionSupported.split('.').shift();
      if (fileMayor !== systemMayor) {
        if (typeof file.report.error === 'undefined') {
          // eslint-disable-next-line no-param-reassign
          file.report.error = [];
        }
        file.report.error.push(`Verona Version of this Player is not compatible 
          with this system's version (\`${this.veronaApiVersionSupported}\`)!`);
      }
    }
    return file;
  }

  public download(element: GetFileResponseData): void {
    this.mds.setSpinnerOn();
    this.bs.downloadFile(element.type, element.name)
      .subscribe(
        (fileData: Blob|boolean) => {
          this.mds.setSpinnerOff();
          if (fileData !== false) {
            saveAs(fileData as Blob, element.name);
          }
        }
      );
  }
}
