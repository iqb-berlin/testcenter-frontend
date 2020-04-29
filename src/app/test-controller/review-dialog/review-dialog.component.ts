import {FormGroup, Validators, FormControl} from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import {ReviewDialogData} from "../test-controller.interfaces";

@Component({
  templateUrl: './review-dialog.component.html'
})
export class ReviewDialogComponent {
  reviewform = new FormGroup({
    target: new FormControl ('b', Validators.required),
    priority: new FormControl('', Validators.required),
    tech: new FormControl(''),
    content: new FormControl(''),
    design: new FormControl(''),
    entry: new FormControl('', Validators.required),
    sender: new FormControl(ReviewDialogComponent.oldName)
  });
  static oldName = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReviewDialogData) { }

  getCategories(): string {
    let myreturn = '';
    if (this.reviewform.get('tech').value === true) {
      myreturn = 'tech';
    }
    if (this.reviewform.get('design').value === true) {
      if (myreturn.length > 0) {
        myreturn += ' ';
      }
      myreturn += 'design';
    }
    if (this.reviewform.get('content').value === true) {
      if (myreturn.length > 0) {
        myreturn += ' ';
      }
      myreturn += 'content';
    }
    return myreturn;
  }
}
