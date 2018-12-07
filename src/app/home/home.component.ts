import { WorkspaceData } from './../admin/backend.service';
import { MainDatastoreService } from './../admin/maindatastore.service';
import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';

import { DeviceDetectorService } from 'ngx-device-detector';



@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  adminloginform: FormGroup;
  isLoggedIn = false;
  isSuperadmin = false;
  loginName = '';
  isError = false;
  errorMessage = '';
  workspaceList: WorkspaceData[] = [];
  deviceInfo = null;

  constructor(private fb: FormBuilder,
    private mds: MainDatastoreService,
    private router: Router,
    private deviceService: DeviceDetectorService) { }

  ngOnInit() {
    this.mds.pageTitle$.next('');
    this.mds.isAdmin$.subscribe(
      is => this.isLoggedIn = is);

    this.adminloginform = this.fb.group({
      testname: this.fb.control('', [Validators.required, Validators.minLength(3)]),
      testpw: this.fb.control('', [Validators.required, Validators.minLength(3)])
    });

    this.mds.workspaceList$.subscribe(list => this.workspaceList = list);
    this.mds.isSuperadmin$.subscribe(is => this.isSuperadmin = is);
    this.mds.loginName$.subscribe(n => this.loginName = n);
  }

  login() {
    this.isError = false;
    this.errorMessage = '';

    if (this.adminloginform.valid) {
      this.mds.login(this.adminloginform.get('testname').value, this.adminloginform.get('testpw').value);
    }
  }

  buttonGotoWorkspace(ws: WorkspaceData) {
    this.mds.updateWorkspaceId(ws.id);
    this.router.navigateByUrl('/admin');
  }

  changeLogin() {
    this.mds.logout();
  }

  sysInfo() {
    this.deviceInfo = this.deviceService.getDeviceInfo();
    const isDesktopDevice = this.deviceService.isDesktop();
  }
  
  removeSysInfo() {
    this.deviceInfo = "";
  }
}
