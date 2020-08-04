import { WorkspaceDataService } from './workspacedata.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {BackendService} from './backend.service';


@Component({
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  private routingSubscription: Subscription = null;

  constructor(
    private route: ActivatedRoute,
    private bs: BackendService,
    public wds: WorkspaceDataService
  ) { }

  ngOnInit() {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.wds.wsId = params['ws'];
      this.bs.getWorkspaceData(this.wds.wsId).subscribe(
        wsData => {
          if (typeof wsData !== 'number') {
            this.wds.wsName = wsData.name;
            this.wds.wsRole = wsData.role;
          }
        }
      );
    });
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
