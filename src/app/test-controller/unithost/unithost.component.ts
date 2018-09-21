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
  // private message = 'yoyoyo';

  // public showIframe = false;
  private iFrameHostElement: HTMLElement;
  private iFrameItemplayer: HTMLIFrameElement;
  private routingSubscription: Subscription;
  public currentValidPages: string[] = [];

    // changed by itemplayer via postMessage, observed here to save (see below)
    // public restorePoint$ = new BehaviorSubject<string>('');
    // public response$ = new BehaviorSubject<string>('');
    // public log$ = new BehaviorSubject<string>('');

  constructor(
    private tcs: TestControllerService,
    private bs: BackendService,
    private location: Location,
    private route: ActivatedRoute
  ) {

    // this.restorePoint$.pipe(
    //   debounceTime(1000)
    // ).subscribe(data => this.bs.setUnitRestorePoint(this.lds.personToken$.getValue(), this._currentUnitId, data));

    // this.response$.pipe(
    //   debounceTime(1000)
    // ).subscribe(data => this.bs.setUnitResponses(this.lds.personToken$.getValue(), this._currentUnitId, data));

    // this.log$.pipe(
    //   bufferTime(1000)
    // ).subscribe(data => this.bs.setUnitLog(this.lds.personToken$.getValue(), this._currentUnitId, data));
  }

  ngOnInit() {
    this.iFrameHostElement = <HTMLElement>document.querySelector('#iFrameHost');

    this.iFrameItemplayer = null;

    this.routingSubscription = this.route.params.subscribe(
      params => {
        // this.message = 'u: ' + params['u'];


        // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
        while (this.iFrameHostElement.hasChildNodes()) {
          this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
        }
        const newUnit: UnitDef = this.route.snapshot.data['unit'];

        if ((newUnit === null) || (newUnit === undefined)) {
          this.tcs.pageTitle$.next('Problem?');
        } else {
          this.tcs.pageTitle$.next(newUnit.label);

          this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
          this.iFrameItemplayer.setAttribute('srcdoc', this.bs.getItemplayer(newUnit.unitDefinitionType));
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
