import { LogindataService } from './../../logindata.service';
import { BackendService, UnitData } from './../backend.service';
import { SyscheckDataService } from './../syscheck-data.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription, BehaviorSubject } from 'rxjs';

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

  private iFrameItemplayer: HTMLIFrameElement;
  private postMessageSubscription: Subscription = null;
  private itemplayerSessionId = '';
  private postMessageTarget: Window = null;

  private itemplayerPageRequest$ = new BehaviorSubject<string>('');
  private itemplayerCurrentPage$ = new BehaviorSubject<string>('');
  private itemplayerValidPages$ = new BehaviorSubject<string[]>([]);
  private pendingItemDefinition$ = new BehaviorSubject(null);

  private dataLoading = false;

  constructor(
    private ds: SyscheckDataService,
    private bs: BackendService,
    private lds: LogindataService
  ) {
    this.itemplayerPageRequest$.subscribe((newPage: string) => {
      if (newPage.length > 0) {
        this.postMessageTarget.postMessage({
          type: 'OpenCBA.ToItemPlayer.PageNavigationRequest',
          sessionId: this.itemplayerSessionId,
          newPage: newPage
        }, '*');
      }
    });
    this.postMessageSubscription = this.lds.postMessage$.subscribe((m: MessageEvent) => {
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
              this.postMessageTarget = m.source;
              this.postMessageTarget.postMessage({
                type: 'OpenCBA.ToItemPlayer.DataTransfer',
                sessionId: this.itemplayerSessionId,
                unitDefinition: pendingSpec
              }, '*');
            }
            break;

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.StartedNotification':
            const validPages = msgData['validPages'];
            if ((validPages instanceof Array) && (validPages.length > 1)) {
              this.itemplayerValidPages$.next(validPages);
              let currentPage = msgData['currentPage'];
              if (currentPage  === undefined) {
                currentPage = validPages[0];
              }
              this.itemplayerCurrentPage$.next(currentPage);
            } else {
              this.itemplayerValidPages$.next([]);
              this.itemplayerCurrentPage$.next('');
            }
            break;

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.ChangedDataTransfer':
            const validPagesChanged = msgData['validPages'];
            let currentPageChanged = msgData['currentPage'];
            if ((validPagesChanged instanceof Array)) {
              this.itemplayerValidPages$.next(validPagesChanged);
              if (currentPageChanged  === undefined) {
                currentPageChanged = validPagesChanged[0];
              }
            }
            if (currentPageChanged  !== undefined) {
              this.itemplayerCurrentPage$.next(currentPageChanged);
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

  ngOnInit() {
    this.iFrameItemplayer = null;
  }

  // // // // // // // // // // // // // // // // // // // // // // // //
  public loadUnit(unitId: string) {
    this.dataLoading = true;

    this.bs.getUnitData(unitId).subscribe((data: UnitData) => {
      // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
      while (this.iFrameHostElement.nativeElement.hasChildNodes()) {
        this.iFrameHostElement.nativeElement.removeChild(this.iFrameHostElement.nativeElement.lastChild);
      }

      this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
      this.iFrameItemplayer.setAttribute('srcdoc', data.player);
      this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
      this.iFrameItemplayer.setAttribute('class', 'unitHost');
      this.iFrameItemplayer.setAttribute('height', String(this.iFrameHostElement.nativeElement.clientHeight));

      this.pendingItemDefinition$.next(data.def);

      this.iFrameHostElement.nativeElement.appendChild(this.iFrameItemplayer);
      this.dataLoading = false;
    });
  }

  ngOnDestroy() {
    this.postMessageSubscription.unsubscribe();
  }
}

