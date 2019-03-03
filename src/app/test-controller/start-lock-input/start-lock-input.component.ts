import { MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Component, OnInit, Inject } from '@angular/core';
import { StartLockData } from '../test-controller.interfaces';


@Component({
  templateUrl: './start-lock-input.component.html',
  styleUrls: ['./start-lock-input.component.css']
})
export class StartLockInputComponent {
  startkeyform: FormGroup;

  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: StartLockData) { }

}
