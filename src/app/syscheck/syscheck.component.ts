import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-syscheck',
  templateUrl: './syscheck.component.html',
  styleUrls: ['./syscheck.component.css']
})
export class SyscheckComponent implements OnInit {
  screenSize: any;

  constructor() { }

  ngOnInit() {
  }

  osInfo() {
    let localVar = window.navigator.userAgent;
    if(localVar.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []) {
      alert(localVar);
    }

    this.screenSize = "Screen size is " + window.screen.width + "pixels by " + window.screen.height + " pixels";
  }

  removeSysInfo() {
    this.screenSize = "";
  }
}
