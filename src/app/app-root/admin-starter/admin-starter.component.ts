import { Component } from '@angular/core';
import {MainDataService} from "../../maindata.service";
import {WorkspaceData} from "../../app.interfaces";
import {Router} from "@angular/router";

@Component({
  templateUrl: './admin-starter.component.html',
})
export class AdminStarterComponent {

  constructor(
    private router: Router,
    public mds: MainDataService
  ) { }

  buttonGotoWorkspaceAdmin(ws: WorkspaceData) {
    this.router.navigateByUrl('/admin/' + ws.id.toString() + '/files');
  }

  resetLogin() {
    this.mds.setNewLoginData();
    this.router.navigate(['/']);
  }
}
