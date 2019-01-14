import { MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
  selector: 'app-save-report',
  templateUrl: './save-report.component.html',
  styleUrls: ['./save-report.component.css']
})
export class SaveReportComponent implements OnInit {
  savereportform: FormGroup;

  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit() {
    this.savereportform = this.fb.group({
      title: this.fb.control('', [Validators.required, Validators.minLength(3)]),
      key: this.fb.control('', [Validators.required, Validators.minLength(3)])
    });
  }
}
