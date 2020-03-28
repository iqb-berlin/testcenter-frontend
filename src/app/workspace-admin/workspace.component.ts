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

  constructor(
    private route: ActivatedRoute,
    public mds: MainDataService,
    public wds: WorkspaceDataService
  ) { }

  ngOnInit() {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.wds.wsId = params['ws'];
      const wsList = this.mds.workspaces;
      if (wsList && wsList[this.wds.wsId]) {
        this.wds.wsName = wsList[this.wds.wsId];
      }
    });
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
