import { Component, OnInit } from '@angular/core';
import {CustomtextService} from "iqb-components";

@Component({
  selector: 'app-status-card',
  templateUrl: './status-card.component.html',
  styles: [
    'mat-card {margin: 10px; background-color: lightgray}'
  ]
})
export class StatusCardComponent implements OnInit {
  constructor(
    public cts: CustomtextService) {}

  ngOnInit(): void {
  }

}
