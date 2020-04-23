import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MainDataService} from "../../maindata.service";
import {CustomtextService} from "iqb-components";
import {ActivatedRoute, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {AuthData} from "../../app.interfaces";
import {BackendService} from "../../backend.service";

@Component({
  templateUrl: './login.component.html',
  styles: [
    'mat-card {margin: 10px;}',
    '.mat-card-gray {background-color: lightgray}'
  ]
})

export class LoginComponent  implements OnInit, OnDestroy {
  private routingSubscription: Subscription = null;
  static oldLoginName = '';
  returnTo = '';
  problemText = '';

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
      authData => {
        this.problemText = '';
        if (typeof authData === 'number') {
          const errCode = authData as number;
          if (errCode === 400) {
            this.problemText = 'Anmeldedaten sind nicht gültig. Bitte nocheinmal versuchen!';
          } else {
            this.problemText = 'Problem bei der Anmeldung.';
            // app.interceptor will show error message
          }
        } else {
          const authDataTyped = authData as AuthData;
          this.mds.setAuthData(authDataTyped);

          if (this.returnTo) {
            this.router.navigateByUrl(this.returnTo);
          } else {
            this.router.navigate(['/r']);
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
