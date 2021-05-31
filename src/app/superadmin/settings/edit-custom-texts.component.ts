import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder } from '@angular/forms';
import { BackendService as MainDataService } from '../../backend.service';
import { BackendService } from '../backend.service';

@Component({
  selector: 'app-custom-texts',
  template: `<p>
    coming soon
  </p>`
})

export class EditCustomTextsComponent {
  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private mbs: MainDataService,
    private bs: BackendService
  ) { }
}
