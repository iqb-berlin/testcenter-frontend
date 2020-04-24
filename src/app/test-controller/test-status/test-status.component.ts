import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {TestControllerService} from "../test-controller.service";
import {CustomtextService} from "iqb-components";
import {UnitMenuButtonData} from "../test-controller.interfaces";

@Component({
  templateUrl: './test-status.component.html',
  styleUrls: ['./test-status.component.css']
})

export class TestStatusComponent implements OnInit, OnDestroy {
  unitMenuButtonList: UnitMenuButtonData[] = [];
  private routingSubscription: Subscription = null;
  private unitMenuButtonListSubscription: Subscription = null;
  flag = '';

  constructor(
    public tcs: TestControllerService,
    public cts: CustomtextService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.routingSubscription = this.route.params.subscribe(params => {
        this.flag = params['f'];
      });
      this.unitMenuButtonListSubscription = this.tcs.unitListForNaviButtons$.subscribe(unitList => {
        this.unitMenuButtonList = [];
        for (let unitIndex = 0; unitIndex < unitList.length; unitIndex++) {
          if (!unitList[unitIndex].disabled && unitList[unitIndex].longLabel.trim()) {
            this.unitMenuButtonList.push({
              sequenceId: unitList[unitIndex].sequenceId,
              label: unitList[unitIndex].longLabel,
              isCurrent: unitList[unitIndex].isCurrent
            })
          }
        }
      })
    })
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    if (this.unitMenuButtonListSubscription !== null) {
      this.unitMenuButtonListSubscription.unsubscribe();
    }
  }
}
