import {Component, OnDestroy, OnInit} from '@angular/core';
import {MainDataService} from '../maindata.service';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';

@Component({
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  private routingSubscription: Subscription = null;
  public myWorkspace = -1;

  constructor(
    private route: ActivatedRoute,
    public mds: MainDataService
  ) { }

  ngOnInit() {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.myWorkspace = Number(params['ws']);
    });
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
