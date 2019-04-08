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
      this.wds.setWorkspace(ws, this.mds.getWorkspaceRole(ws), this.mds.getWorkspaceName(ws));
    });

    this.logindataSubscription = this.mds.loginData$.subscribe(ld => {
      this.wds.setWorkspace(this.wds.ws, this.mds.getWorkspaceRole(this.wds.ws), this.mds.getWorkspaceName(this.wds.ws));
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
