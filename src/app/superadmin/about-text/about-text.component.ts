import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild } from '@angular/core';
import { DatastoreService } from '../datastore.service';
import { MatSort, MatDialog, MatSnackBar } from '@angular/material';
import { FormGroup, FormsModule, FormBuilder } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType } from '../../iqb-common';
// import { AboutComponent } from './../../about';
import { MainDatastoreService } from './../../admin/maindatastore.service';
import { BackendService as BackendServiceReadOnly } from './../../backend.service';
import { BackendService as BackendServiceSuperAdmin } from './../backend.service';
// import * as Quill from 'quill';



@Component({
  selector: 'itc-about-text',
  templateUrl: './about-text.component.html',
  styleUrls: ['./about-text.component.css']
})
export class AboutTextComponent implements OnInit {
  aboutTextForm: FormGroup;
  public dataLoading = false;
  aboutText: string;

  constructor(
    private mds: MainDatastoreService,
    private bsRO: BackendServiceReadOnly,
    private bsSA: BackendServiceSuperAdmin,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.aboutTextForm = this.fb.group({
      myTextArea: this.fb.control('')
    });
    this.mds.pageTitle$.next('');
    this.bsRO.getAboutText().subscribe(t => this.aboutTextForm.get('myTextArea').setValue(t as string));
  }

  setAboutText() {

    this.bsSA.setAboutText(this.mds.adminToken$.getValue(), this.aboutTextForm.get('myTextArea').value).subscribe(respOk => {
      if (respOk) {
        this.snackBar.open('Geänderter Text', '', {duration: 1500});
      } else {
        this.snackBar.open('Text konnte nicht geändert werden', 'Fehler', {duration: 1500});
      }
      this.dataLoading = false;
    });
  }



}
