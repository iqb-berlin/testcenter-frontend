import { FormGroup } from '@angular/forms';
import { BackendService, ServerError } from './../backend.service';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Component, OnInit } from '@angular/core';
import { TestControllerService } from '../test-controller.service';
import { ReviewDialogComponent } from './review-dialog.component';
import { LogindataService } from '../../logindata.service';

@Component({
  selector: 'tc-menu-buttons',
  templateUrl: './tc-menu-buttons.component.html',
  styleUrls: ['./tc-menu-buttons.component.css']
})
export class TcMenuButtonsComponent implements OnInit {
  private showReviewMenuEntry = false;

  constructor(
    private tcs: TestControllerService,
    private reviewDialog: MatDialog,
    private bs: BackendService,
    private lds: LogindataService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.tcs.isReviewMode$.subscribe(is => this.showReviewMenuEntry = is);
  }

  showReviewDialog() {
    const currentUnit = this.tcs.currentUnit$.getValue();
    const currentBookletId = this.lds.bookletDbId$.getValue();
    let currentUnitLabel = '';
    if (currentUnit !== null) {
      currentUnitLabel = currentUnit.label;
    }
    const dialogRef = this.reviewDialog.open(ReviewDialogComponent, {
      width: '700px',
      data: {
        loginname: this.lds.loginName$.getValue(),
        bookletname: this.lds.bookletLabel$.getValue(),
        unitname: currentUnitLabel
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (typeof result !== 'undefined') {
        if (result !== false) {
          const targetSelection = (<FormGroup>result).get('target').value;
          if (targetSelection === 'u') {
            this.bs.saveUnitReview(
                this.tcs.authorisation$.getValue(),
                currentUnit.dbId,
                (<FormGroup>result).get('priority').value,
                dialogRef.componentInstance.getCategories(),
                (<FormGroup>result).get('entry').value
              ).subscribe(myData => {
                if (myData instanceof ServerError) {
                  const e = myData as ServerError;
                  this.snackBar.open('Konnte Kommentar nicht speichern (' + e.code.toString() + ': ' + e.label, '', {duration: 3000});
                } else {
                  const ok = myData as boolean;
                  if (ok) {
                    this.snackBar.open('Kommentar gespeichert', '', {duration: 1000});
                  } else {
                    this.snackBar.open('Konnte Kommentar nicht speichern.', '', {duration: 3000});
                  }
                }
              });
          } else {
            this.bs.saveBookletReview(
              this.tcs.authorisation$.getValue(),
              (<FormGroup>result).get('priority').value,
              dialogRef.componentInstance.getCategories(),
              (<FormGroup>result).get('entry').value
            ).subscribe(myData => {
              if (myData instanceof ServerError) {
                const e = myData as ServerError;
                this.snackBar.open('Konnte Kommentar nicht speichern (' + e.code.toString() + ': ' + e.label, '', {duration: 3000});
              } else {
                const ok = myData as boolean;
                if (ok) {
                  this.snackBar.open('Kommentar gespeichert', '', {duration: 1000});
                } else {
                  this.snackBar.open('Konnte Kommentar nicht speichern.', '', {duration: 3000});
                }
              }
            });
          }
        }
      }
    });
  }
}
