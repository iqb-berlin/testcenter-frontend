import { WorkspaceDataService } from './workspacedata.service';
import { MainDataService } from '../maindata.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';


@Component({
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  private routingSubscription: Subscription = null;
  private logindataSubscription: Subscription = null;

  constructor(
    private route: ActivatedRoute,
    public mds: MainDataService,
    public wds: WorkspaceDataService
  ) { }

  ngOnInit() {
    this.routingSubscription = this.route.params.subscribe(params => {
      const ws = Number(params['ws']);
      this.wds.setWorkspace(ws);
    });

    this.logindataSubscription = this.mds.loginData$.subscribe(() => {
      this.wds.setWorkspace(this.wds.ws);
    });
  }


  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    if (this.logindataSubscription !== null) {
      this.logindataSubscription.unsubscribe();
    }
  }
}
