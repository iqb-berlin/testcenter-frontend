import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Component, Inject } from '@angular/core';

@Component({
  selector: 'tc-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.css']
})
export class AboutDialogComponent {

  constructor(
    @Inject('APP_NAME') private appName: string,
    @Inject('APP_PUBLISHER') private appPublisher: string,
    @Inject('APP_VERSION') private appVersion: string,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

}
