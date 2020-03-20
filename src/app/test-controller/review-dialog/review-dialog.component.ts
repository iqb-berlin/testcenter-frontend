import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
  templateUrl: './review-dialog.component.html'
})
export class ReviewDialogComponent implements OnInit {
  reviewform: FormGroup;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.reviewform = this.fb.group({
      target: this.fb.control('b', Validators.required),
      priority: this.fb.control('', Validators.required),
      tech: this.fb.control(''),
      content: this.fb.control(''),
      design: this.fb.control(''),
      entry: this.fb.control('', Validators.required)
    });
  }

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
