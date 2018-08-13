import { TestdataService } from './../test-controller';
import { BackendService } from './../shared/backend.service';
import { Router } from '@angular/router';
import { GlobalStoreService } from './../shared/global-store.service';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';


@Component({
  selector: 'tc-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  testtakerloginform: FormGroup;
  isSession: boolean;
  isError = false;
  errorMessage = '';

  constructor(private fb: FormBuilder,
    private router: Router,
    private gss: GlobalStoreService,
    private tss: TestdataService,
    private bs: BackendService) { }

  ngOnInit() {
    this.gss.updatePageTitle('IQB-Testcenter - Willkommen!');
    this.tss.isSession$.subscribe(is => {
      this.isSession = is;
    });

    this.testtakerloginform = this.fb.group({
      testname: this.fb.control('', [Validators.required, Validators.minLength(3)]),
      testpw: this.fb.control('', [Validators.required, Validators.minLength(3)])
    });
  }

  testtakerlogin() {
    this.isError = false;
    this.errorMessage = '';
    this.bs.testlogin(this.testtakerloginform.get('testname').value, this.testtakerloginform.get('testpw').value).subscribe(
      (loginToken: string) => {
        this.gss.loginToken = loginToken;
        this.router.navigateByUrl('/start');
      }, (errormsg: string) => {
        this.isError = true;
        this.errorMessage = errormsg;
       }
    );
  }
}
