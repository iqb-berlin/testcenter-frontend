import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MainDataService } from '../../maindata.service';
import { AuthData } from '../../app.interfaces';
import { BackendService } from '../../backend.service';

@Component({
  templateUrl: './login.component.html',
  styles: [
    'mat-card {margin: 10px;}',
    '.mat-card-box {background: var(--tc-box-background)}',
    '#toggle-show-password {cursor: pointer}'
  ]
})

export class LoginComponent implements OnInit, OnDestroy {
  static oldLoginName = '';
  private routingSubscription: Subscription = null;
  returnTo = '';
  problemText = '';
  showPassword = false;

  loginForm = new FormGroup({
    name: new FormControl(LoginComponent.oldLoginName, [Validators.required, Validators.minLength(3)]),
    pw: new FormControl('')
  });

  constructor(
    public mds: MainDataService,
    private bs: BackendService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.mds.setSpinnerOff();
    this.mds.appSubTitle$.next('Bitte anmelden');
    this.routingSubscription = this.route.params
      .subscribe(params => { this.returnTo = params.returnTo; });
  }

  login(): void {
    const loginData = this.loginForm.value;
    LoginComponent.oldLoginName = loginData.name;
    this.mds.setSpinnerOn();
    this.bs.login(loginData.name, loginData.pw).subscribe(
      authData => {
        this.mds.setSpinnerOff();
        this.problemText = '';
        if (typeof authData === 'number') {
          const errCode = authData as number;
          if (errCode === 400) {
            this.problemText = 'Anmeldedaten sind nicht gültig. Bitte noch einmal versuchen!';
          } else if (errCode === 401) {
            this.problemText = 'Anmeldung abgelehnt. Anmeldedaten sind noch nicht freigeben.';
          } else if (errCode === 204) {
            this.problemText = 'Anmeldedaten sind gültig, aber es sind keine Arbeitsbereiche oder Tests freigegeben.';
          } else if (errCode === 410) {
            this.problemText = 'Anmeldedaten sind abgelaufen';
          } else {
            this.problemText = 'Problem bei der Anmeldung.';
            // app.interceptor will show error message
          }
        } else {
          const authDataTyped = authData as AuthData;
          this.mds.setAuthData(authDataTyped);
          if (this.returnTo) {
            this.router.navigateByUrl(this.returnTo).then(navOk => {
              if (!navOk) {
                this.router.navigate(['/r']);
              }
            });
          } else {
            this.router.navigate(['/r']);
          }
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
