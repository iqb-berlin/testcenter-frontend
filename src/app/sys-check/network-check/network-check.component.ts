import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'iqb-network-check',
  templateUrl: './network-check.component.html',
  styleUrls: ['./network-check.component.css']
})
export class NetworkCheckComponent implements OnInit {
  dataLoading = false;

  constructor() { }

  ngOnInit() {
    this.dataLoading = true;
  }

}
