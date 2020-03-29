import { NewpasswordComponent } from './newpassword/newpassword.component';
import { NewuserComponent } from './newuser/newuser.component';
import { BackendService } from '../backend.service';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild } from '@angular/core';

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import {
  ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType, ServerError
} from 'iqb-components';
import { MainDataService } from 'src/app/maindata.service';
import {IdRoleData, UserData} from "../superadmin.interfaces";
import {SuperadminPasswordRequestComponent} from "../superadmin-password-request/superadmin-password-request.component";


@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  public objectsDatasource: MatTableDataSource<UserData>;
  public displayedColumns = ['selectCheckbox', 'name'];
  private tableselectionCheckbox = new SelectionModel<UserData>(true, []);
  private tableselectionRow = new SelectionModel<UserData>(false, []);
  public selectedUser = -1;
  private selectedUserName = '';

  private pendingWorkspaceChanges = false;
  public WorkspacelistDatasource: MatTableDataSource<IdRoleData>;
  public displayedWorkspaceColumns = ['selectCheckbox', 'label'];

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private bs: BackendService,
    private mds: MainDataService,
    private newuserDialog: MatDialog,
    private newpasswordDialog: MatDialog,
    private confirmDialog: MatDialog,
    private superadminPasswordDialog: MatDialog,
    private messsageDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.tableselectionRow.changed.subscribe(
      r => {
        if (r.added.length > 0) {
          this.selectedUser = r.added[0].id;
          this.selectedUserName = r.added[0].name
        } else {
          this.selectedUser = -1;
          this.selectedUserName = '';
        }
        this.updateWorkspaceList();
      });
  }

  ngOnInit() {
    setTimeout(() => {
      this.updateObjectList();
    })
  }

  // ***********************************************************************************
  addObject() {
    const dialogRef = this.newuserDialog.open(NewuserComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (typeof result !== 'undefined') {
        if (result !== false) {
          this.mds.incrementDelayedProcessesCount();
          this.bs.addUser((<FormGroup>result).get('name').value,
              (<FormGroup>result).get('pw').value).subscribe(
                respOk => {
                  if (respOk !== false) {
                    this.snackBar.open('Nutzer hinzugefügt', '', {duration: 1000});
                    this.updateObjectList();
                  } else {
                    this.snackBar.open('Konnte Nutzer nicht hinzufügen', 'Fehler', {duration: 1000});
                  }
                  this.mds.decrementDelayedProcessesCount();
                });
        }
      }
    });
  }

  changeSuperadminStatus() {
    let selectedRows = this.tableselectionRow.selected;
    if (selectedRows.length === 0) {
      selectedRows = this.tableselectionCheckbox.selected;
    }
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Superadmin-Status ändern',
          content: 'Bitte markieren Sie erst einen Nutzer!',
          type: MessageType.error
        }
      });
    } else {
      const userObject = <UserData>selectedRows[0];
      const confirmDialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Ändern des Superadmin-Status',
          content: 'Für "' + userObject.name + '" den Status auf "' + (userObject.is_superadmin === '0' ? '' : 'NICHT ') + 'Superadmin" setzen?',
          confirmbuttonlabel: 'Status ändern',
          showcancel: true
        }
      });

      confirmDialogRef.afterClosed().subscribe(result => {
        if ((typeof result !== 'undefined') && (result !== false)) {
          const passwdDialogRef = this.superadminPasswordDialog.open(SuperadminPasswordRequestComponent, {
            width: '600px',
            data: 'Superadmin-Status ' + (userObject.is_superadmin === '0' ? 'setzen' : 'entziehen')
          });

          passwdDialogRef.afterClosed().subscribe(result => {
            if (typeof result !== 'undefined') {
              if (result !== false) {
                this.mds.incrementDelayedProcessesCount();
                this.bs.setSuperUserStatus(
                  selectedRows[0]['id'],
                  userObject.is_superadmin === '0',
                  (<FormGroup>result).get('pw').value).subscribe(
                  respOk => {
                    if (respOk !== false) {
                      this.snackBar.open('Status geändert', '', {duration: 1000});
                    } else {
                      this.snackBar.open('Konnte Status nicht ändern', 'Fehler', {duration: 1000});
                    }
                    this.mds.decrementDelayedProcessesCount();
                  });
              }
            }
          });
        }
      });
    }
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
        data: selectedRows[0]['name']
      });

      dialogRef.afterClosed().subscribe(result => {
        if (typeof result !== 'undefined') {
          if (result !== false) {
            this.mds.incrementDelayedProcessesCount();
            this.bs.changePassword(selectedRows[0]['id'],
                (<FormGroup>result).get('pw').value).subscribe(
                  respOk => {
                    if (respOk !== false) {
                      this.snackBar.open('Kennwort geändert', '', {duration: 1000});
                    } else {
                      this.snackBar.open('Konnte Kennwort nicht ändern', 'Fehler', {duration: 1000});
                    }
                    this.mds.decrementDelayedProcessesCount();
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
      const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Nutzern',
          content: prompt + 'gelöscht werden?',
          confirmbuttonlabel: 'Nutzer löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          // =========================================================
          this.mds.incrementDelayedProcessesCount();
          const usersToDelete = [];
          selectedRows.forEach((r: UserData) => usersToDelete.push(r.id));
          this.bs.deleteUsers(usersToDelete).subscribe(
            respOk => {
              if (respOk !== false) {
                this.snackBar.open('Nutzer gelöscht', '', {duration: 1000});
                this.updateObjectList();
              } else {
                this.snackBar.open('Konnte Nutzer nicht löschen', 'Fehler', {duration: 2000});
              }
              this.mds.decrementDelayedProcessesCount();
            });
        }
      });
    }
  }

  // ***********************************************************************************
  updateWorkspaceList() {
    this.pendingWorkspaceChanges = false;
    if (this.selectedUser > -1) {
      this.mds.incrementDelayedProcessesCount();
      this.bs.getWorkspacesByUser(this.selectedUser).subscribe(dataresponse => {
        if (dataresponse instanceof ServerError) {
          this.mds.appError$.next({
            label: (dataresponse as ServerError).labelNice,
            description: (dataresponse as ServerError).labelSystem,
            category: "PROBLEM"
          });
        } else {
          this.WorkspacelistDatasource = new MatTableDataSource(dataresponse);
        }
        this.mds.decrementDelayedProcessesCount()
      })
    } else {
      this.WorkspacelistDatasource = null;
    }
  }

  selectWorkspace(ws: IdRoleData, role: string) {
    if (ws.role === role) {
      ws.role = '';
    } else {
      ws.role = role;
    }
    this.pendingWorkspaceChanges = true;
  }

  saveWorkspaces() {
    this.pendingWorkspaceChanges = false;
    if (this.selectedUser > -1) {
      this.mds.incrementDelayedProcessesCount();
      this.bs.setWorkspacesByUser(this.selectedUser, this.WorkspacelistDatasource.data).subscribe(
        respOk => {
          if (respOk !== false) {
            this.snackBar.open('Zugriffsrechte geändert', '', {duration: 1000});
          } else {
            this.snackBar.open('Konnte Zugriffsrechte nicht ändern', 'Fehler', {duration: 2000});
          }
          this.mds.decrementDelayedProcessesCount();
        });
    } else {
      this.WorkspacelistDatasource = null;
    }
  }

  // ***********************************************************************************
  updateObjectList() {
    this.mds.incrementDelayedProcessesCount();
    this.tableselectionCheckbox.clear();
    this.tableselectionRow.clear();
    this.bs.getUsers().subscribe(dataresponse => {
      if (dataresponse instanceof ServerError) {
        this.mds.appError$.next({
          label: (dataresponse as ServerError).labelNice,
          description: (dataresponse as ServerError).labelSystem,
          category: "PROBLEM"
        });
      } else {
        this.objectsDatasource = new MatTableDataSource(dataresponse);
        this.objectsDatasource.sort = this.sort;
      }
      this.mds.decrementDelayedProcessesCount();
    });
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
