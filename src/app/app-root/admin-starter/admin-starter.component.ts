import {Component, OnInit} from '@angular/core';
import {MainDataService} from "../../maindata.service";
import {Router} from "@angular/router";

interface WorkspaceData {
  id: string;
  name: string;
}

@Component({
  templateUrl: './admin-starter.component.html',
})

export class AdminStarterComponent implements OnInit {
  workspaces: WorkspaceData[] = [];
  isSuperAdmin = false;

  constructor(
    private router: Router,
    public mds: MainDataService
  ) { }

  ngOnInit() {
    const workspaces = this.mds.workspaces;
    for (let wsId of Object.keys(workspaces)) {
      this.workspaces.push({
        id: wsId,
        name: workspaces[wsId],
      })
    }
  }

  buttonGotoWorkspaceAdmin(ws: WorkspaceData) {
    this.router.navigateByUrl('/admin/' + ws.id.toString() + '/files');
  }

  resetLogin() {
    this.mds.setNewLoginData();
    this.router.navigate(['/']);
  }
}
