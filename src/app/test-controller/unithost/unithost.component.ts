import { Authorisation } from './../../logindata.service';
import { debounceTime, bufferTime, switchMap } from 'rxjs/operators';
import { UnitDef, TestControllerService, UnitLogData, UnitResponseData, UnitRestorePointData } from './../test-controller.service';
import { Subscriber, Subscription, BehaviorSubject, Observable, of } from 'rxjs';
import { BackendService } from './../backend.service';
import { ServerError } from './../../backend.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Location } from '@angular/common';
import { LogindataService } from '../../logindata.service';

@Component({
  templateUrl: './unithost.component.html',
  styleUrls: ['./unithost.component.css']
})

export class UnithostComponent implements OnInit, OnDestroy {
  // private message = 'yoyoyo';

  // public showIframe = false;
  private iFrameHostElement: HTMLElement;
  private iFrameItemplayer: HTMLIFrameElement;
  private routingSubscription: Subscription = null;
  public currentValidPages: string[] = [];
  public leaveWarning = false;
  public leaveWarningText = 'Du hast den Hörtext noch nicht vollständig gehört. Nach dem ' +
          'Verlassen der Aufgabe wird der Hörtext nicht noch einmal gestartet. Trotzdem die Aufgabe verlassen?';

  private myUnitNumber = -1;
  private myUnitName = '';

  // :::::::::::::::::::::
  private postMessageSubscription: Subscription = null;
  private itemplayerSessionId = '';
  private postMessageTarget: Window = null;
  private pendingUnitDefinition$ = new BehaviorSubject<string>('');
  private pendingRestorePoint$ = new BehaviorSubject<string>('');

  // changed by itemplayer via postMessage, observed here to save (see below)
  public restorePoint$ = new BehaviorSubject<UnitRestorePointData>(null);
  public response$ = new BehaviorSubject<UnitResponseData>(null);
  public log$ = new BehaviorSubject<UnitLogData>(null);

  // buffering restorePoints
  private lastBookletState = '';
  private lastUnitResponses = '';
  private restorePoints: {[unitname: string]: string} = {};

  constructor(
    private tcs: TestControllerService,
    private bs: BackendService,
    private lds: LogindataService,
    private location: Location,
    private route: ActivatedRoute
  ) {
    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.postMessageSubscription = this.lds.postMessage$.subscribe((m: MessageEvent) => {
      const msgData = m.data;
      const msgType = msgData['type'];

      if ((msgType !== undefined) && (msgType !== null)) {
        switch (msgType) {

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.ReadyNotification':
            let hasData = false;
            const initParams = {};

            const pendingSpec = this.pendingUnitDefinition$.getValue();
            if (pendingSpec.length > 0) {
              hasData = true;
              this.pendingUnitDefinition$.next('');
            }

            if (hasData) {
              const pendingRespp = this.pendingRestorePoint$.getValue();
              if (pendingRespp.length > 0) {
                this.pendingRestorePoint$.next('');
              }

              this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();
              this.log$.next({'unitName': this.myUnitName, 'logEntry': 'start'});
              this.postMessageTarget = m.source as Window;
              this.postMessageTarget.postMessage({
                type: 'OpenCBA.ToItemPlayer.DataTransfer',
                sessionId: this.itemplayerSessionId,
                unitDefinition: pendingSpec,
                restorePoint: pendingRespp
              }, '*');
            }
            break;

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.StartedNotification':
            const validPages = msgData['validPages'];
            if ((validPages instanceof Array) && (validPages.length > 1)) {
              this.tcs.itemplayerValidPages$.next(validPages);
              let currentPage = msgData['currentPage'];
              if (currentPage  === undefined) {
                currentPage = validPages[0];
              }
              this.tcs.itemplayerCurrentPage$.next(currentPage);
            } else {
              this.tcs.itemplayerValidPages$.next([]);
              this.tcs.itemplayerCurrentPage$.next('');
            }

            const canLeave = msgData['canLeave'];
            if (canLeave !== undefined) {
              if (canLeave as string === 'warning') {
                this.leaveWarning = true;
              }
            }
            break;

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.ChangedDataTransfer':
            const validPagesChanged = msgData['validPages'];
            let currentPageChanged = msgData['currentPage'];
            if ((validPagesChanged instanceof Array)) {
              this.tcs.itemplayerValidPages$.next(validPagesChanged);
              if (currentPageChanged  === undefined) {
                currentPageChanged = validPagesChanged[0];
              }
            }
            if (currentPageChanged !== undefined) {
              this.tcs.itemplayerCurrentPage$.next(currentPageChanged);
            }

            const restorePoint = msgData['restorePoint'] as string;
            if (restorePoint !== undefined) {
              this.restorePoint$.next({'unitName': this.myUnitName, 'restorePoint': restorePoint});
            }
            const response = msgData['response'] as string;
            if (response !== undefined) {
              this.response$.next({'unitName': this.myUnitName, 'response': response, 'responseType': msgData['responseType']});
            }
            const canLeaveChanged = msgData['canLeave'];
            if (canLeaveChanged !== undefined) {
              this.leaveWarning = (canLeaveChanged as string === 'warning');
            }


            // const logEntries = msgData['logEntries'] as string[];
            // if ((logEntries !== undefined) && (logEntries.length > 0)) {
            //   logEntries.forEach(log => {
            //     this.log$.next({'unitName': this.myUnitName, 'msg': log});
            //   });
            // }
            break;

          // // // // // // //
          default:
            console.log('processMessagePost ignored message: ' + msgType);
            break;
        }
      }
    });

    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.restorePoint$.pipe(
      debounceTime(300)).subscribe(data => {
        if (data !== null) {
          const b = this.tcs.booklet$.getValue();
          if (b !== null) {
            const u = b.getUnitAt(this.myUnitNumber);
            if (u !== null) {
              u.restorePoint = data.restorePoint;
            }
          }

          this.restorePoints[data.unitName] = data.restorePoint;
          if (this.lds.loginMode$.getValue() !== 'review') {
            this.bs.setUnitRestorePoint(this.lds.authorisation$.getValue(), data.unitName, data.restorePoint)
            .subscribe();
          }
        }
    });

    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.response$.pipe(
      debounceTime(300)
    ).subscribe(data => {
        if ((data !== null) && (this.lds.loginMode$.getValue() !== 'review')) {
          this.bs.setUnitResponses(this.lds.authorisation$.getValue(), data.unitName, data.response, data.responseType)
          .subscribe();
      }
    });

    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.log$.pipe(
      bufferTime(500)
    ).subscribe((data: UnitLogData[]) => {
      if (data.length > 0) {
        const myLogs = {};
        data.forEach(lg => {
          if (lg !== null) {
            if (lg.logEntry.length > 0) {
              if (typeof myLogs[lg.unitName] === 'undefined') {
                myLogs[lg.unitName] = [];
              }
              myLogs[lg.unitName].push(JSON.stringify(lg.logEntry));
            }
          }
        });
        for (const unitName in myLogs) {
          if (myLogs[unitName].length > 0) {
            this.bs.setUnitLog(this.lds.authorisation$.getValue(), unitName, myLogs[unitName]).subscribe();
          }
        }
      }
    });

    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.tcs.itemplayerPageRequest$.subscribe(newUnitPage => {
      if ((this.postMessageTarget !== null) && (newUnitPage.length > 0)) {
        this.postMessageTarget.postMessage({
          type: 'OpenCBA.ToItemPlayer.PageNavigationRequest',
          sessionId: this.itemplayerSessionId,
          newPage: newUnitPage
        }, '*');
      }
    });
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnInit() {
    this.iFrameHostElement = <HTMLElement>document.querySelector('#iFrameHost');

    this.iFrameItemplayer = null;
    this.leaveWarning = false;

    this.routingSubscription = this.route.params.subscribe(params => {
      this.myUnitNumber = +params['u'];
      this.loadItemplayer();
    });

    this.lds.authorisation$.subscribe(auth => {
      this.restorePoints = {};
    });

    this.tcs.currentUnitPos$.subscribe(up => {
      if (up >= 0) {
        this.loadItemplayer();
      }
    });
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  loadItemplayer() {
    while (this.iFrameHostElement.hasChildNodes()) {
      this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
    }
    const currentUnitId = this.tcs.currentUnitPos$.getValue();
    const booklet = this.tcs.booklet$.getValue();
    if ((currentUnitId >= 0) && (this.myUnitNumber === currentUnitId) && (booklet !== null)) {
      const currentUnit = booklet.getUnitAt(currentUnitId);
      this.tcs.pageTitle$.next(currentUnit.label); // (currentUnitId + 1).toString() + '. '
      this.myUnitName = currentUnit.id;

      this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
      this.iFrameItemplayer.setAttribute('srcdoc', this.tcs.getItemplayer(currentUnit.unitDefinitionType));
      this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
      this.iFrameItemplayer.setAttribute('class', 'unitHost');
      const sideNavElement = document.getElementsByName('sideNav')[0];
      this.iFrameItemplayer.setAttribute('height', String(sideNavElement.clientHeight - 5));

      this.pendingUnitDefinition$.next(currentUnit.unitDefinition);
      const restorePoint = this.restorePoints[this.myUnitName];
      this.leaveWarning = false;

      if ((restorePoint === null) || (restorePoint === undefined)) {
        this.pendingRestorePoint$.next(currentUnit.restorePoint);
      } else {
        this.pendingRestorePoint$.next(restorePoint);
      }
      // this.tss.pendingItemResources$.next(newUnit.getResourcesAsDictionary());
      // this.tss.pendingItemRestorePoint$.next(newUnit.restorePoint);

      this.iFrameHostElement.appendChild(this.iFrameItemplayer);    }
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
