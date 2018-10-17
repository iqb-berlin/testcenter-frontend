import { Observable, BehaviorSubject } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { MatTabsModule, MatSelectModule, MatFormFieldModule } from '@angular/material';
import { MainDatastoreService } from './maindatastore.service';
import { WorkspaceData } from './backend.service';


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
  private notLoggedInMessage = '';

  // CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
  constructor(
    private mds: MainDatastoreService
  ) {
    this.mds.isAdmin$.subscribe(is => this.isAdmin = is);
    this.mds.notLoggedInMessage$.subscribe(msg => {
      if ((msg === null) || (msg.length === 0)) {
        this.notLoggedInMessage = 'Bitte anmelden!';
      } else {
        this.notLoggedInMessage = msg;
      }
    });
  }

  // CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
  ngOnInit() {
    this.mds.workspaceId$.subscribe(id => {
      console.log('enter ' + id);
      if (id >= 0) {
        const workspaceList = this.mds.workspaceList$.getValue();
        if (workspaceList.length > 0) {
          for (let i = 0; i < workspaceList.length; i++) {
            console.log('check: ' + workspaceList[i].id);
            if (workspaceList[i].id == id) {
              console.log('got');
              this.mds.updatePageTitle('IQB-Testcenter Verwaltung: ' + workspaceList[i].name);
              break;
            }
          }
        }
      } else {
        this.mds.updatePageTitle('IQB-Testcenter Verwaltung...');
      }
    })
  }
}
