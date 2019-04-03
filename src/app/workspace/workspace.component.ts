import { WorkspaceDataService } from './workspacedata.service';
import { MainDataService } from './../maindata.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTabsModule, MatSelectModule, MatFormFieldModule } from '@angular/material';


@Component({
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  public navLinks = [
    {path: 'files', label: 'Dateien'},
    {path: 'syscheck', label: 'System-Check Berichte'},
    {path: 'monitor', label: 'Monitor'},
    {path: 'results', label: 'Ergebnisse'}
  ];

  public pageTitle = '';
  private routingSubscription: Subscription = null;
  private logindataSubscription: Subscription = null;

  // CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
  constructor(
    private route: ActivatedRoute,
    private mds: MainDataService,
    private wds: WorkspaceDataService
  ) { }

  // CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
  ngOnInit() {
    this.routingSubscription = this.route.params.subscribe(params => {
      const ws = Number(params['ws']);
      this.wds.setWorkspaceId(ws);
      if ((this.mds.adminToken.length > 0) && (ws > 0)) {
        this.pageTitle = this.mds.getWorkspaceName(ws) + ' (' + this.mds.getWorkspaceRole(ws) + ')';
      } else {
        this.pageTitle = '';
      }
    });

    this.logindataSubscription = this.mds.loginData$.subscribe(ld => {
      const ws = this.wds.ws;
      if (ws > 0) {
        this.pageTitle = this.mds.getWorkspaceName(ws) + ' (' + this.mds.getWorkspaceRole(ws) + ')';
      } else {
        this.pageTitle = '';
      }
    });
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    if (this.logindataSubscription !== null) {
      this.logindataSubscription.unsubscribe();
    }
  }
}
