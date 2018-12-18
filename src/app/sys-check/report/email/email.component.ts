import { MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
  selector: 'app-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.css']
})
export class EmailComponent implements OnInit {
  emailreportform: FormGroup;

  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit() {
    this.emailreportform = this.fb.group({
      subject: this.fb.control('', [Validators.required])
    });
  }
}
