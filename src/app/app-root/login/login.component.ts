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
    'mat-card {margin: 10px;}'
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
    const loginData = this.loginForm.value;
    LoginComponent.oldLoginName = loginData['name'];
    this.bs.login(loginData['name'], loginData['pw']).subscribe(
      loginData => {
        if (loginData instanceof ServerError) {
          const e = loginData as ServerError;
          if (e.code === 400) {
            this.mds.appError$.next({
              label: 'Diese Anmeldedaten sind für diesen Server nicht gültig.',
              description: e.labelSystem + ' (' + e.code.toString + ')',
              category: "PROBLEM"
            });
          }
          this.mds.addCustomtextsFromDefList(appconfig.customtextsLogin);
          // no change in other data
        } else {
          if ((loginData as LoginData).customTexts) {
            this.cts.addCustomTexts((loginData as LoginData).customTexts);
          }
          this.mds.setAuthData(loginData as LoginData);

          if (this.returnTo) {
            this.router.navigateByUrl(this.returnTo);
          } else {
            if (this.mds.adminToken) {
              this.router.navigate(['/r/admin-starter']);
            } else if (this.mds.loginToken) {
              this.router.navigate(['/r/code-input']);
            } else if (this.mds.personToken) {
              this.router.navigate(['/r/test-starter']);
            } else {
              this.mds.appError$.next({
                label: 'Keine Berechtigung für diese Anmeldedaten gefunden.',
                description: 'Request ohne Fehler, aber kein Token?!',
                category: "PROBLEM"
              });
            }
          }
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
