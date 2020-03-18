import { NewpasswordComponent } from './newpassword/newpassword.component';
import { NewuserComponent } from './newuser/newuser.component';
import { BackendService, IdRoleData, IdAndName } from '../backend.service';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild, OnDestroy } from '@angular/core';

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import {
  ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType
} from 'iqb-components';
import { Subscription } from 'rxjs';
import { MainDataService } from 'src/app/maindata.service';


@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, OnDestroy {
  public isSuperadmin = false;
  public dataLoading = false;
  public objectsDatasource: MatTableDataSource<IdAndName>;
  public displayedColumns = ['selectCheckbox', 'name'];
  private tableselectionCheckbox = new SelectionModel<IdAndName>(true, []);
  private tableselectionRow = new SelectionModel<IdAndName>(false, []);
  private selectedUser = -1;

  private pendingWorkspaceChanges = false;
  public WorkspacelistDatasource: MatTableDataSource<IdRoleData>;
  public displayedWorkspaceColumns = ['selectCheckbox', 'label'];
  private logindataSubscription: Subscription = null;

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    private bs: BackendService,
    private mds: MainDataService,
    private newuserDialog: MatDialog,
    private newpasswordDialog: MatDialog,
    private deleteConfirmDialog: MatDialog,
    private messsageDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.tableselectionRow.changed.subscribe(
      r => {
        if (r.added.length > 0) {
          this.selectedUser = r.added[0].id;
        } else {
          this.selectedUser = -1;
        }
        this.updateWorkspaceList();
      });
  }

  ngOnInit() {
    this.logindataSubscription = this.mds.loginData$.subscribe(ld => {
      this.isSuperadmin = ld.isSuperadmin;
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
          this.bs.addUser((<FormGroup>result).get('name').value,
              (<FormGroup>result).get('pw').value).subscribe(
                respOk => {
                  if (respOk !== false) {
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
            this.bs.changePassword(selectedRows[0]['id'],
                (<FormGroup>result).get('pw').value).subscribe(
                  respOk => {
                    if (respOk !== false) {
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
          confirmbuttonlabel: 'Nutzer löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          // =========================================================
          this.dataLoading = true;
          const usersToDelete = [];
          selectedRows.forEach((r: IdAndName) => usersToDelete.push(r.id));
          this.bs.deleteUsers(usersToDelete).subscribe(
            respOk => {
              if (respOk !== false) {
                this.snackBar.open('Nutzer gelöscht', '', {duration: 1000});
                this.updateObjectList();
                this.dataLoading = false;
              } else {
                this.snackBar.open('Konnte Nutzer nicht löschen', 'Fehler', {duration: 2000});
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
    if (this.selectedUser > -1) {
      this.dataLoading = true;
      this.bs.getWorkspacesByUser(this.selectedUser).subscribe(dataresponse => {
          this.WorkspacelistDatasource = new MatTableDataSource(dataresponse);
          this.dataLoading = false;
        });
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
      this.dataLoading = true;
      this.bs.setWorkspacesByUser(this.selectedUser, this.WorkspacelistDatasource.data).subscribe(
        respOk => {
          if (respOk !== false) {
            this.snackBar.open('Zugriffsrechte geändert', '', {duration: 1000});
          } else {
            this.snackBar.open('Konnte Zugriffsrechte nicht ändern', 'Fehler', {duration: 2000});
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
      this.tableselectionCheckbox.clear();
      this.tableselectionRow.clear();
      this.bs.getUsers().subscribe(dataresponse => {
          this.objectsDatasource = new MatTableDataSource(dataresponse);
          this.objectsDatasource.sort = this.sort;
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

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.logindataSubscription !== null) {
      this.logindataSubscription.unsubscribe();
    }
  }
}
