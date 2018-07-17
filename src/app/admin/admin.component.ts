import { Observable, BehaviorSubject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { MatTabsModule, MatSelectModule, MatFormFieldModule } from '@angular/material';
import { StatusService } from './status.service';
import { WorkspaceData } from './backend/backend.service';


@Component({
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  public navLinks = [
    {path: 'myfiles', label: 'Dateien'},
    {path: 'monitor', label: 'Monitor'},
    {path: 'results', label: 'Ergebnisse'}
  ];

  private isAdmin = false;
  private myWorkspaces: WorkspaceData[];
  private notLoggedInMessage = '';

  private wsSelector = new FormControl();

  // CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
  constructor(
    private ass: StatusService
  ) {
    this.ass.isAdmin$.subscribe(is => this.isAdmin = is);
    this.ass.workspaceList$.subscribe(wsL => {
      this.myWorkspaces = wsL;
    });
    this.ass.notLoggedInMessage$.subscribe(msg => {
      if ((msg === null) || (msg.length === 0)) {
        this.notLoggedInMessage = 'Bitte anmelden!';
      } else {
        this.notLoggedInMessage = msg;
      }
    });
  }

  // CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
  ngOnInit() {
    this.ass.workspaceId$.subscribe(id => {
      this.wsSelector.setValue(id, {emitEvent: false});
    });

    this.wsSelector.valueChanges
      .subscribe(wsId => {
        this.ass.updateWorkspaceId(wsId);
    });

    this.ass.updatePageTitle('Testverwaltung');
  }
}
