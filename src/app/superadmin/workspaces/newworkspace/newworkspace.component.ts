import { MAT_DIALOG_DATA } from '@angular/material';
import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  templateUrl: './newworkspace.component.html',
  styleUrls: ['./newworkspace.component.css']
})
export class NewworkspaceComponent implements OnInit {
  newworkspaceform: FormGroup;

  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.newworkspaceform = this.fb.group({
      name: this.fb.control('', [Validators.required, Validators.minLength(3)])
    });
  }
}
