import { Component } from '@angular/core';
import {CustomtextService} from "iqb-components";

@Component({
  templateUrl: './privacy.component.html',
  styles: [
    'mat-card {margin: 10px; background-color: lightgray}'
  ]
})
export class PrivacyComponent {

  constructor(
    public cts: CustomtextService
  ) { }

}
