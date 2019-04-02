import { LoginData, WorkspaceData } from './../app.interfaces';
import { BackendService, ServerError } from './../backend.service';
import { MainDataService } from './../maindata.service';
import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';


@Component({
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit, OnDestroy {
  adminloginform: FormGroup;
  private loginDataSubscription: Subscription = null;
  public showLogin = true;

  constructor(private fb: FormBuilder,
    private mds: MainDataService,
    private bs: BackendService,
    private router: Router) { }

  ngOnInit() {
    this.adminloginform = this.fb.group({
      testname: this.fb.control('', [Validators.required, Validators.minLength(3)]),
      testpw: this.fb.control('', [Validators.required, Validators.minLength(3)])
    });
    this.loginDataSubscription = this.mds.loginData$.subscribe(logindata => {
      this.showLogin = logindata.admintoken.length === 0;
    });
  }

  // *******************************************************************************************************
  login() {
    if (this.adminloginform.valid) {
      this.bs.login(
        this.adminloginform.get('testname').value, this.adminloginform.get('testpw').value
      ).subscribe(admindata => {
        if (admindata instanceof ServerError) {
          this.mds.setNewLoginData();
          this.mds.setNewErrorMsg(admindata as ServerError);
        } else {
          this.mds.setNewLoginData(admindata as LoginData);
          this.mds.setNewErrorMsg();
        }
      });
    }
  }

  buttonGotoWorkspace(ws: WorkspaceData) {
    this.router.navigateByUrl('/ws/' + ws.id.toString());
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.loginDataSubscription !== null) {
      this.loginDataSubscription.unsubscribe();
    }
  }
}
