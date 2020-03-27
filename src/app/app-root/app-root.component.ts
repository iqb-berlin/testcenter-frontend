import {Component, OnDestroy, OnInit} from '@angular/core';
import {MainDataService} from "../maindata.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {CustomtextService} from "iqb-components";

@Component({
  selector: 'app-app-root',
  templateUrl: './app-root.component.html',
  styles: ['.root-frame {padding: 80px;}']
})
export class AppRootComponent implements OnInit, OnDestroy {
  loginForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    pw: new FormControl('')
  });

  constructor(
    public mds: MainDataService,
    public cts: CustomtextService
  ) { }

  ngOnInit(): void {
  }

  login() {
    const loginData = this.loginForm.value;
    this.mds.appError$.next({
      label: loginData['name'],
      description: loginData['pw'],
      category: "FATAL"
    })
  }

  ngOnDestroy() {
  }
}
