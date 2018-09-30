import { FormGroup } from '@angular/forms';
import { BackendService } from './../backend.service';
import { ServerError } from './../../backend.service';
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
    this.tcs.canReview$.subscribe(is => {
        this.showReviewMenuEntry = is;
      });
  }

  showReviewDialog() {
    const currentUnitPos = this.tcs.currentUnitPos$.getValue();
    let currentUnitId = '';
    const currentBookletId = this.lds.bookletDbId$.getValue();
    let currentUnitLabel = '';
    if (currentUnitPos >= 0) {
      const booklet = this.tcs.booklet$.getValue();
      if (booklet !== null) {
        const currentUnit = booklet.getUnitAt(currentUnitPos);
        currentUnitLabel = currentUnit.label;
        currentUnitId = currentUnit.id;
      }
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
                this.lds.authorisation$.getValue(),
                currentUnitId,
                (<FormGroup>result).get('priority').value,
                dialogRef.componentInstance.getCategories(),
                (<FormGroup>result).get('entry').value
              ).subscribe(myData => {
                if (myData instanceof ServerError) {
                  const e = myData as ServerError;
                  this.snackBar.open('Konnte Kommentar nicht speichern (' + e.code.toString() + ': ' + e.labelNice, '', {duration: 3000});
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
              this.lds.authorisation$.getValue(),
              (<FormGroup>result).get('priority').value,
              dialogRef.componentInstance.getCategories(),
              (<FormGroup>result).get('entry').value
            ).subscribe(myData => {
              if (myData instanceof ServerError) {
                const e = myData as ServerError;
                this.snackBar.open('Konnte Kommentar nicht speichern (' + e.code.toString() + ': ' + e.labelNice, '', {duration: 3000});
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
