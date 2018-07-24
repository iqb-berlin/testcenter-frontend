import { MAT_DIALOG_DATA } from '@angular/material';
import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  templateUrl: './newpassword.component.html',
  styleUrls: ['./newpassword.component.css']
})

export class NewpasswordComponent implements OnInit {
  newpasswordform: FormGroup;

  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.newpasswordform = this.fb.group({
      pw: this.fb.control('', [Validators.required, Validators.minLength(3)])
    });
  }
}
