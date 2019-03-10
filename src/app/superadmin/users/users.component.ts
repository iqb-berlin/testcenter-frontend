import { MainDatastoreService } from './../../admin/maindatastore.service';
import { NewpasswordComponent } from './newpassword/newpassword.component';
import { NewuserComponent } from './newuser/newuser.component';
import { BackendService, GetUserDataResponse, IdLabelSelectedData, ServerError } from '../backend.service';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild } from '@angular/core';

import { Component, OnInit } from '@angular/core';
import { MatSort, MatDialog, MatSnackBar } from '@angular/material';
import { FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType } from '../../iqb-common';


@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  private isSuperadmin = false;
  public dataLoading = false;
  public objectsDatasource: MatTableDataSource<GetUserDataResponse>;
  public displayedColumns = ['selectCheckbox', 'name'];
  private tableselectionCheckbox = new SelectionModel <GetUserDataResponse>(true, []);
  private tableselectionRow = new SelectionModel <GetUserDataResponse>(false, []);
  private selectedUser = '';

  private pendingWorkspaceChanges = false;
  public WorkspacelistDatasource: MatTableDataSource<IdLabelSelectedData>;
  public displayedWorkspaceColumns = ['selectCheckbox', 'label'];

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private mds: MainDatastoreService,
    private bs: BackendService,
    private newuserDialog: MatDialog,
    private newpasswordDialog: MatDialog,
    private deleteConfirmDialog: MatDialog,
    private messsageDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.tableselectionRow.changed.subscribe(
      r => {
        this.selectedUser = r.added[0].name;
        this.updateWorkspaceList();
      });
  }

  ngOnInit() {
    this.mds.isSuperadmin$.subscribe(i => {
      this.isSuperadmin = i;
      this.updateObjectList();
    });
  }

  // ***********************************************************************************
  addObject() {
    const dialogRef = this.newuserDialog.open(NewuserComponent, {
      width: '600px',
      data: {
        name: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (typeof result !== 'undefined') {
        if (result !== false) {
          this.bs.addUser(
              this.mds.adminToken$.getValue(),
              (<FormGroup>result).get('name').value,
              (<FormGroup>result).get('pw').value).subscribe(
                respOk => {
                  if (respOk) {
                    this.snackBar.open('Nutzer hinzugefügt', '', {duration: 1000});
                    this.updateObjectList();
                  } else {
                    this.snackBar.open('Konnte Nutzer nicht hinzufügen', 'Fehler', {duration: 1000});
                  }
                });
        }
      }
    });
  }

  changePassword() {
    let selectedRows = this.tableselectionRow.selected;
    if (selectedRows.length === 0) {
      selectedRows = this.tableselectionCheckbox.selected;
    }
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Kennwort ändern',
          content: 'Bitte markieren Sie erst einen Nutzer!',
          type: MessageType.error
        }
      });
    } else {
      const dialogRef = this.newpasswordDialog.open(NewpasswordComponent, {
        width: '600px',
        data: {
          name: selectedRows[0]['name']
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (typeof result !== 'undefined') {
          if (result !== false) {
            this.dataLoading = true;
            this.bs.changePassword(
                this.mds.adminToken$.getValue(),
                selectedRows[0]['name'],
                (<FormGroup>result).get('pw').value).subscribe(
                  respOk => {
                    if (respOk) {
                      this.snackBar.open('Kennwort geändert', '', {duration: 1000});
                    } else {
                      this.snackBar.open('Konnte Kennwort nicht ändern', 'Fehler', {duration: 1000});
                    }
                    this.dataLoading = false;
                  });
          }
        }
      });
    }
  }

  deleteObject() {
    let selectedRows = this.tableselectionCheckbox.selected;
    if (selectedRows.length === 0) {
      selectedRows = this.tableselectionRow.selected;
    }
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Löschen von Nutzern',
          content: 'Bitte markieren Sie erst Nutzer!',
          type: MessageType.error
        }
      });
    } else {
      let prompt = 'Soll';
      if (selectedRows.length > 1) {
        prompt = prompt + 'en ' + selectedRows.length + ' Nutzer ';
      } else {
        prompt = prompt + ' Nutzer "' + selectedRows[0].name + '" ';
      }
      const dialogRef = this.deleteConfirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Nutzern',
          content: prompt + 'gelöscht werden?',
          confirmbuttonlabel: 'Nutzer löschen'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          // =========================================================
          this.dataLoading = true;
          const usersToDelete = [];
          selectedRows.forEach((r: GetUserDataResponse) => usersToDelete.push(r.name));
          this.bs.deleteUsers(this.mds.adminToken$.getValue(), usersToDelete).subscribe(
            respOk => {
              if (respOk) {
                this.snackBar.open('Nutzer gelöscht', '', {duration: 1000});
                this.updateObjectList();
                this.dataLoading = false;
              } else {
                this.snackBar.open('Konnte Nutzer nicht löschen', 'Fehler', {duration: 1000});
                this.dataLoading = false;
              }
          });
        }
      });
    }
  }

  // ***********************************************************************************
  updateWorkspaceList() {
    this.pendingWorkspaceChanges = false;
    if (this.selectedUser.length > 0) {
      this.dataLoading = true;
      this.bs.getWorkspacesByUser(this.mds.adminToken$.getValue(), this.selectedUser).subscribe(
        (dataresponse: IdLabelSelectedData[]) => {
          this.WorkspacelistDatasource = new MatTableDataSource(dataresponse);
          this.dataLoading = false;
        }, (err: ServerError) => {
          // this.ass.updateAdminStatus('', '', [], err.label);
          this.dataLoading = false;
        });
    } else {
      this.WorkspacelistDatasource = null;
    }
  }

  selectWorkspace(ws?: IdLabelSelectedData) {
    ws.selected = !ws.selected;
    this.pendingWorkspaceChanges = true;
  }

  saveWorkspaces() {
    this.pendingWorkspaceChanges = false;
    if (this.selectedUser.length > 0) {
      this.dataLoading = true;
      this.bs.setWorkspacesByUser(this.mds.adminToken$.getValue(), this.selectedUser, this.WorkspacelistDatasource.data).subscribe(
        respOk => {
          if (respOk) {
            this.snackBar.open('Zugriffsrechte geändert', '', {duration: 1000});
          } else {
            this.snackBar.open('Konnte Zugriffsrechte nicht ändern', 'Fehler', {duration: 1000});
          }
          this.dataLoading = false;
        });
    } else {
      this.WorkspacelistDatasource = null;
    }
  }

  // ***********************************************************************************
  updateObjectList() {
    if (this.isSuperadmin) {
      this.dataLoading = true;
      this.bs.getUsers(this.mds.adminToken$.getValue()).subscribe(
        (dataresponse: GetUserDataResponse[]) => {
          this.objectsDatasource = new MatTableDataSource(dataresponse);
          this.objectsDatasource.sort = this.sort;
          this.tableselectionCheckbox.clear();
          this.tableselectionRow.clear();
          this.dataLoading = false;
        }, (err: ServerError) => {
          // this.ass.updateAdminStatus('', '', [], err.label);
          this.tableselectionCheckbox.clear();
          this.tableselectionRow.clear();
          this.dataLoading = false;
        }
      );
    }
  }

  isAllSelected() {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.objectsDatasource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
        this.tableselectionCheckbox.clear() :
        this.objectsDatasource.data.forEach(row => this.tableselectionCheckbox.select(row));
  }

  selectRow(row) {
    this.tableselectionRow.select(row);
  }
}
