import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MainDataService} from "../../maindata.service";
import {CustomtextService} from "iqb-components";
import {ActivatedRoute, Router} from "@angular/router";
import {Subscription} from "rxjs";

@Component({
  templateUrl: './login.component.html',
  styles: [
    'mat-card {margin: 10px;}',
    'mat-card:last-of-type {background-color: lightgray;}',
  ]
})

export class LoginComponent  implements OnInit, OnDestroy {
  private routingSubscription: Subscription = null;
  static oldLoginName = '';
  returnTo = '';

  loginForm = new FormGroup({
    name: new FormControl(LoginComponent.oldLoginName, [Validators.required, Validators.minLength(3)]),
    pw: new FormControl('')
  });

  constructor(
    public mds: MainDataService,
    public cts: CustomtextService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.returnTo = params['returnTo'];
    })
  }

  login() {
    const loginData = this.loginForm.value;
    LoginComponent.oldLoginName = loginData['name'];
    this.mds.appError$.next({
      label: loginData['name'],
      description: loginData['pw'],
      category: "FATAL"
    });
    if (this.returnTo) {
      this.router.navigateByUrl(this.returnTo);
    }
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
