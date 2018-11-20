import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild } from '@angular/core';
import { DatastoreService } from '../datastore.service';
import { MatSort, MatDialog, MatSnackBar } from '@angular/material';
import { FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmDialogComponent, ConfirmDialogData, MessageDialogComponent,
  MessageDialogData, MessageType } from '../../iqb-common';
// import { AboutComponent } from './../../about';
import { MainDatastoreService } from './../../admin/maindatastore.service';
import { BackendService } from './../../backend.service';

@Component({
  selector: 'itc-about-text',
  templateUrl: './about-text.component.html',
  styleUrls: ['./about-text.component.css']
})
export class AboutTextComponent implements OnInit {
  myAboutText : string;



  constructor(
    private mds: MainDatastoreService,
    private bs: BackendService
  ) { }

  ngOnInit() {
    // get pre-existing text, even if default
    this.mds.pageTitle$.next('');
    this.bs.getAboutText().subscribe(t => this.myAboutText = t as string);
  }

  setAboutText() {
    this.myAboutText;


    console.log(this.myAboutText);

  }

}
