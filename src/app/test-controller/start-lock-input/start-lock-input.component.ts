import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {StartLockData} from "../test-controller.interfaces";

@Component({
  templateUrl: './start-lock-input.component.html',
  styleUrls: ['./start-lock-input.component.css']
})
export class StartLockInputComponent {
  startkeyform: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: StartLockData) {

    const myFormControls = {};
    this.data.codes.forEach(c => {
      myFormControls[c.testletId] = new FormControl(c.value, [Validators.required, Validators.minLength(3)]);
    });
    this.startkeyform = new FormGroup(myFormControls);
  }
}
