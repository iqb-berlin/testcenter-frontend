import { MainDataService } from '../../maindata.service';
import { BackendService, UnitData } from '../backend.service';
import { SyscheckDataService } from '../syscheck-data.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription, BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

// import { BackendService, UnitPreviewData } from './backend.service';
// import { DatastoreService } from './datastore.service';
// import { MainDatastoreService } from './../maindatastore.service';



@Component({
  selector: 'iqb-unit-check',
  templateUrl: './unit-check.component.html',
  styleUrls: ['./unit-check.component.css']
})
export class UnitCheckComponent implements OnInit, OnDestroy {
  @ViewChild('iFrameHost') iFrameHostElement: ElementRef;
  unitcheckEnabled = false;

  private iFrameItemplayer: HTMLIFrameElement = null;
  private postMessageSubscription: Subscription = null;
  private itemplayerSessionId = '';
  private postMessageTarget: Window = null;

  private pendingItemDefinition$ = new BehaviorSubject(null);

  private dataLoading = false;

  constructor(
    private ds: SyscheckDataService,
    private bs: BackendService,
    private mds: MainDataService
  ) {
  }

  ngOnInit() {
    this.ds.itemplayerPageRequest$.subscribe((newPage: string) => {
      if (newPage.length > 0) {
        this.postMessageTarget.postMessage({
          type: 'OpenCBA.ToItemPlayer.PageNavigationRequest',
          sessionId: this.itemplayerSessionId,
          newPage: newPage
        }, '*');
      }
    });
    this.postMessageSubscription = this.mds.postMessage$.subscribe((m: MessageEvent) => {
      const msgData = m.data;
      const msgType = msgData['type'];
      console.log(msgData);

      if ((msgType !== undefined) && (msgType !== null)) {
        switch (msgType) {

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.ReadyNotification':
            let hasData = false;
            const initParams = {};

            const pendingSpec = this.pendingItemDefinition$.getValue();
            if ((pendingSpec !== null) && (pendingSpec.length > 0)) {
              hasData = true;
              this.pendingItemDefinition$.next(null);
            }

            if (hasData) {
              this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();
              this.postMessageTarget = m.source as Window;
              this.postMessageTarget.postMessage({
                type: 'OpenCBA.ToItemPlayer.DataTransfer',
                sessionId: this.itemplayerSessionId,
                unitDefinition: pendingSpec
              }, '*');
            }
            break;

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.StartedNotification':
            this.iFrameItemplayer.setAttribute('height', String(Math.trunc(this.iFrameHostElement.nativeElement.clientHeight)));
            const validPages = msgData['validPages'];
            if ((validPages instanceof Array) && (validPages.length > 1)) {
              this.ds.itemplayerValidPages$.next(validPages);
              let currentPage = msgData['currentPage'];
              if (currentPage  === undefined) {
                currentPage = validPages[0];
              }
              this.ds.itemplayerCurrentPage$.next(currentPage);
            } else {
              this.ds.itemplayerValidPages$.next([]);
              this.ds.itemplayerCurrentPage$.next('');
            }
            break;

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.ChangedDataTransfer':
            const validPagesChanged = msgData['validPages'];
            let currentPageChanged = msgData['currentPage'];
            if ((validPagesChanged instanceof Array)) {
              this.ds.itemplayerValidPages$.next(validPagesChanged);
              if (currentPageChanged  === undefined) {
                currentPageChanged = validPagesChanged[0];
              }
            }
            if (currentPageChanged  !== undefined) {
              this.ds.itemplayerCurrentPage$.next(currentPageChanged);
            }
            break;

          // // // // // // //
          default:
            console.log('processMessagePost ignored message: ' + msgType);
            break;
        }
      }
    });
  }

  // // // // // // // // // // // // // // // // // // // // // // // //
  public loadUnit(checkId: string) {
    this.dataLoading = true;
    while (this.iFrameHostElement.nativeElement.hasChildNodes()) {
      this.iFrameHostElement.nativeElement.removeChild(this.iFrameHostElement.nativeElement.lastChild);
    }

    // sometimes, the stepper takes too much time to show the next step component - if the data come too early, the
    // iframehost has still height of 0px, so no iframe content is shown; the delay of the data arrival ensures
    // that iframehost is in full height when the iframe is filled up
    this.bs.getUnitData(checkId).pipe(
      delay(1000)
    ).subscribe((data: UnitData) => {
      // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

      this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
      this.iFrameItemplayer.setAttribute('srcdoc', data.player);
      this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
      this.iFrameItemplayer.setAttribute('class', 'unitHost');
      this.iFrameItemplayer.setAttribute('height', '100');

      this.pendingItemDefinition$.next(data.def);

      this.iFrameHostElement.nativeElement.appendChild(this.iFrameItemplayer);
      this.dataLoading = false;
    });
  }

  ngOnDestroy() {
    this.postMessageSubscription.unsubscribe();
  }
}

