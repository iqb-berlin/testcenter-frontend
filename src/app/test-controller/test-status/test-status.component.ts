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
      this.unitMenuButtonList = [];
      for (let unitIndex = 0; unitIndex < this.tcs.unitListForNaviButtons.length; unitIndex++) {
        if (!this.tcs.unitListForNaviButtons[unitIndex].disabled && this.tcs.unitListForNaviButtons[unitIndex].longLabel.trim()) {
          this.unitMenuButtonList.push({
            sequenceId: this.tcs.unitListForNaviButtons[unitIndex].sequenceId,
            label: this.tcs.unitListForNaviButtons[unitIndex].longLabel,
            isCurrent: this.tcs.unitListForNaviButtons[unitIndex].isCurrent
          })
        }
      }
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
