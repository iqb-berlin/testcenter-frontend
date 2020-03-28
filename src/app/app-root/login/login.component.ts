import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MainDataService} from "../../maindata.service";
import {CustomtextService, ServerError} from "iqb-components";
import {ActivatedRoute, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {appconfig} from "../../app.config";
import {LoginData} from "../../app.interfaces";
import {BackendService} from "../../backend.service";

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
    private bs: BackendService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.returnTo = params['returnTo'];
    })
  }

  login() {
    this.mds.incrementDelayedProcessesCount();
    const loginData = this.loginForm.value;
    LoginComponent.oldLoginName = loginData['name'];
    this.bs.login(loginData['name'], loginData['pw']).subscribe(
      loginData => {
        if (loginData instanceof ServerError) {
          const e = loginData as ServerError;
          this.mds.appError$.next({
            label: e.labelNice,
            description: e.labelSystem + ' (' + e.code.toString + ')',
            category: "PROBLEM"
          });
          this.mds.addCustomtextsFromDefList(appconfig.customtextsLogin);
          // no change in other data
        } else {
          if ((loginData as LoginData).customTexts) {
            this.cts.addCustomTexts((loginData as LoginData).customTexts);
          }
          this.mds.setNewLoginData(loginData as LoginData);

          if (this.returnTo) {
            this.router.navigateByUrl(this.returnTo);
          } else {
            const loginDataCleaned = this.mds.loginData$.getValue();
            if (loginDataCleaned.adminToken.length > 0) {
              this.router.navigate(['../admin-starter'], {relativeTo: this.route});
            } else if (loginDataCleaned.loginToken.length > 0) {
              this.router.navigate(['../code-input'], {relativeTo: this.route});
            } else if (loginDataCleaned.personToken.length > 0) {
              this.router.navigate(['../test-starter'], {relativeTo: this.route});
            } else {
              this.mds.appError$.next({
                label: 'Keine Berechtigung für diese Anmeldedaten gefunden.',
                description: 'Request ohne Fehler, aber kein Token?!',
                category: "PROBLEM"
              });
            }
          }
        }
        this.mds.decrementDelayedProcessesCount();
      }
    );
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
