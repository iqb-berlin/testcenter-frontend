import { MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, Inject } from '@angular/core';
import { StartLockData } from '../test-controller.interfaces';


@Component({
  templateUrl: './start-lock-input.component.html',
  styleUrls: ['./start-lock-input.component.css']
})
export class StartLockInputComponent implements OnInit{
  startkeyform: FormGroup;

  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: StartLockData) { }

  ngOnInit() {
    const controlsConfig = {};
    this.data.codes.forEach(c => {
      controlsConfig[c.testletId] = this.fb.control('', [Validators.required, Validators.minLength(3)])
    });
    this.startkeyform = this.fb.group(controlsConfig);
  }
}
