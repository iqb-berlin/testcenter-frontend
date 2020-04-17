import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";

@Component({
  templateUrl: './no-unit.component.html',
  styleUrls: ['./no-unit.component.css']
})

export class NoUnitComponent implements OnInit, OnDestroy {
  private routingSubscription: Subscription = null;
  flag = '';

  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.routingSubscription = this.route.params.subscribe(params => {
        this.flag = params['f'];
      })
    })
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
