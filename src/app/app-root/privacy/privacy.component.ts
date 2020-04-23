import { Component } from '@angular/core';
import {CustomtextService} from "iqb-components";

@Component({
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.css']
})
export class PrivacyComponent {

  constructor(
    public cts: CustomtextService
  ) { }

}
