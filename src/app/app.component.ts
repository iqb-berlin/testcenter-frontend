import { environment } from './../environments/environment';
import { merge ,  Observable ,  Observer ,  Subscriber ,  Subscription } from 'rxjs';

import { distinctUntilChanged ,  switchMap } from 'rxjs/operators';
import { TestdataService } from './test-controller';
import { IqbCommonModule, ConfirmDialogComponent, ConfirmDialogData } from './iqb-common';
import { BackendService } from './shared/backend.service';
import { Router } from '@angular/router';
import { AboutDialogComponent } from './about-dialog/about-dialog.component';
import { GlobalStoreService } from './shared/global-store.service';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'tc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent implements OnInit {
  public title = '';
  public navPrevEnabled = false;
  public navNextEnabled = false;
  public isSession = false;

  constructor (
    private gss: GlobalStoreService,
    private tss: TestdataService,
    private bsApp: BackendService,
    private router: Router,
    private bs: BackendService,
    public aboutDialog: MatDialog) { }

  ngOnInit() {
    this.tss.isSession$.subscribe(is => this.isSession = is);
    this.tss.navNextEnabled$.subscribe(is => this.navNextEnabled = is);
    this.tss.navPrevEnabled$.subscribe(is => this.navPrevEnabled = is);

    merge(
      this.gss.pageTitle$,
      this.tss.pageTitle$).subscribe(t => {
        this.title = t;
      });

    window.addEventListener('message', (event) => {
      this.tss.processMessagePost(event);
    }, false);
  }

  // *******************************************************************************************************
  showAboutDialog() {
    const dialogRef = this.aboutDialog.open(AboutDialogComponent, {
      width: '500px',
      data: {}
    });
  }

  navPrev() {
    this.tss.gotoPrevUnit();
  }

  navNext() {
    this.tss.gotoNextUnit();
  }
}
