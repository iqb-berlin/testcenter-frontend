import { LogindataService } from './../../logindata.service';
import { UnitDef, TestControllerService } from './../test-controller.service';
import { Subscriber ,  Subscription } from 'rxjs';
import { BackendService } from './../backend.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Location } from '@angular/common';

@Component({
  templateUrl: './unithost.component.html',
  styleUrls: ['./unithost.component.css']
})

export class UnithostComponent implements OnInit, OnDestroy {
  private message = '';

  // public showIframe = false;
  private iFrameHostElement: HTMLElement;
  private iFrameItemplayer: HTMLIFrameElement;
  private routingSubscription: Subscription;

  constructor(
    private lds: LogindataService,
    private tcs: TestControllerService,
    private bs: BackendService,
    private location: Location,
    private route: ActivatedRoute
  ) {
    this.lds.globalErrorMsg$.subscribe(s => {
      this.message = s;
    });
  }

  ngOnInit() {
    this.iFrameHostElement = <HTMLElement>document.querySelector('#iFrameHost');

    this.iFrameItemplayer = null;

    this.routingSubscription = this.route.params.subscribe(
      params => {
        // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
        while (this.iFrameHostElement.hasChildNodes()) {
          this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
        }
        const newUnit: UnitDef = this.route.snapshot.data['unit'];

        if ((newUnit === null) || (newUnit === undefined)) {
          const messageElement = <HTMLElement>document.createElement('p');
          messageElement.setAttribute('class', 'unitMessage');
          messageElement.innerHTML = this.message;
          this.iFrameHostElement.appendChild(messageElement);

          this.tcs.pageTitle$.next('Problem?');
          this.tcs.updateUnitId(-1);
        } else {
          this.tcs.pageTitle$.next(newUnit.title);
          this.tcs.updateUnitId(newUnit.sequenceId);

          this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
          this.iFrameItemplayer.setAttribute('srcdoc', newUnit.getItemplayerHtml());
          this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
          this.iFrameItemplayer.setAttribute('class', 'unitHost');
          this.iFrameItemplayer.setAttribute('height', String(this.iFrameHostElement.clientHeight));

          // this.tcs.pendingItemDefinition$.next(newUnit.dataForItemplayer);
          // this.tss.pendingItemResources$.next(newUnit.getResourcesAsDictionary());
          // this.tss.pendingItemRestorePoint$.next(newUnit.restorePoint);

          this.iFrameHostElement.appendChild(this.iFrameItemplayer);
        }
      });
  }

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  ngOnDestroy() {
    this.routingSubscription.unsubscribe();
  }
}
