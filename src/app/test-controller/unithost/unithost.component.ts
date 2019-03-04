import { MainDataService } from './../../maindata.service';
import { debounceTime, bufferTime, switchMap } from 'rxjs/operators';
import { TestControllerService } from './../test-controller.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { BackendService } from './../backend.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Location } from '@angular/common';
import { UnitRestorePointData, UnitResponseData, UnitLogData, TaggedString, PageData } from '../test-controller.interfaces';

@Component({
  templateUrl: './unithost.component.html',
  styleUrls: ['./unithost.component.css']
})

export class UnithostComponent implements OnInit, OnDestroy {
  private iFrameHostElement: HTMLElement;
  private iFrameItemplayer: HTMLIFrameElement;
  private routingSubscription: Subscription = null;
  public currentValidPages: string[] = [];
  public leaveWarning = false;
  public leaveWarningText = 'Du hast den Hörtext noch nicht vollständig gehört. Nach dem ' +
          'Verlassen der Aufgabe wird der Hörtext nicht noch einmal gestartet. Trotzdem die Aufgabe verlassen?';

  private myUnitNumber = -1;
  private myUnitName = '';
  private unitTitle = '';

  // :::::::::::::::::::::
  private postMessageSubscription: Subscription = null;
  private itemplayerSessionId = '';
  private postMessageTarget: Window = null;
  private pendingUnitDefinition: TaggedString = null;
  private pendingUnitRestorePoint: TaggedString = null;

  private itemplayerValidPages: string[] = [];
  private itemplayerCurrentPage = '';
  private showPageNav = false;
  private pageList: PageData[] = [];

  // changed by itemplayer via postMessage, observed here to save (see below)
  public restorePoint$ = new BehaviorSubject<UnitRestorePointData>(null);
  public response$ = new BehaviorSubject<UnitResponseData>(null);
  public log$ = new BehaviorSubject<UnitLogData>(null);



  constructor(
    private tcs: TestControllerService,
    private bs: BackendService,
    private mds: MainDataService,
    private location: Location,
    private route: ActivatedRoute
  ) {
    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.postMessageSubscription = this.mds.postMessage$.subscribe((m: MessageEvent) => {
      const msgData = m.data;
      const msgType = msgData['type'];
      let msgPlayerId = msgData['sessionId'];
      if ((msgPlayerId === undefined) || (msgPlayerId === null)) {
        msgPlayerId = this.itemplayerSessionId;
      }

      if ((msgType !== undefined) && (msgType !== null)) {
        switch (msgType) {

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.ReadyNotification':
            let pendingUnitDef = '';
            if (this.pendingUnitDefinition !== null) {
              if (this.pendingUnitDefinition.tag === msgPlayerId) {
                pendingUnitDef = this.pendingUnitDefinition.value;
                this.pendingUnitDefinition = null;
              }
            }

            let pendingRestorePoint = '';
            if (this.pendingUnitRestorePoint !== null) {
              if (this.pendingUnitRestorePoint.tag === msgPlayerId) {
                pendingRestorePoint = this.pendingUnitRestorePoint.value;
                this.pendingUnitRestorePoint = null;
              }
            }

            this.postMessageTarget = m.source as Window;
            this.postMessageTarget.postMessage({
              type: 'OpenCBA.ToItemPlayer.DataTransfer',
              sessionId: this.itemplayerSessionId,
              unitDefinition: pendingUnitDef,
              restorePoint: pendingRestorePoint
            }, '*');

            break;

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.StartedNotification':
            if (msgPlayerId === this.itemplayerSessionId) {
              this.setPageList(msgData['validPages'], msgData['currentPage']);

              const canLeave = msgData['canLeave'];
              if (canLeave !== undefined) {
                if (canLeave as string === 'warning') {
                  this.leaveWarning = true;
                }
              }
            }
            break;

          // // // // // // //
          case 'OpenCBA.FromItemPlayer.ChangedDataTransfer':
            if (msgPlayerId === this.itemplayerSessionId) {
              this.setPageList(msgData['validPages'], msgData['currentPage']);

              const restorePoint = msgData['restorePoint'] as string;
              if (restorePoint !== undefined) {
                this.restorePoint$.next({
                  unitName: this.myUnitName,
                  unitSequenceId: this.myUnitNumber,
                  restorePoint: restorePoint});
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
            }
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
          this.tcs.addUnitRestorePoint(data.unitSequenceId, data.restorePoint);
          // if (this.lds.loginMode$.getValue() !== 'review') {
          //   this.bs.setUnitRestorePoint(this.lds.personToken$.getValue(),
          //       this.lds.bookletDbId$.getValue(), data.unitName, data.restorePoint)
          //   .subscribe();
          // }
        }
    });

    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.response$.pipe(
      debounceTime(300)
    ).subscribe(data => {
        // if ((data !== null) && (this.lds.loginMode$.getValue() !== 'review')) {
        //   this.bs.setUnitResponses(this.lds.personToken$.getValue(),
        //       this.lds.bookletDbId$.getValue(), data.unitName, data.response, data.responseType)
        //   .subscribe();
      // }
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
            // ## this.bs.setUnitLog(this.lds.personToken$.getValue(),
            // this.lds.bookletDbId$.getValue(), unitName, myLogs[unitName]).subscribe();
          }
        }
      }
    });
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnInit() {
    this.iFrameHostElement = <HTMLElement>document.querySelector('#iFrameHost');

    this.iFrameItemplayer = null;
    this.leaveWarning = false;

    this.routingSubscription = this.route.params.subscribe(params => {
      this.myUnitNumber = Number(params['u']);
      this.tcs.currentUnitSequenceId = this.myUnitNumber;

      while (this.iFrameHostElement.hasChildNodes()) {
        this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
      }

      if ((this.myUnitNumber >= 1) && (this.myUnitNumber === this.myUnitNumber) && (this.tcs.rootTestlet !== null)) {
        const currentUnit = this.tcs.rootTestlet.getUnitAt(this.myUnitNumber);
        this.unitTitle = currentUnit.unitDef.title; // (currentUnitId + 1).toString() + '. '
        this.myUnitName = currentUnit.unitDef.id;
        this.tcs.currentUnitId = this.myUnitName;
        this.tcs.currentUnitTitle = this.unitTitle;
        this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();

        this.setPageList([], '');

        this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
        this.iFrameItemplayer.setAttribute('srcdoc', this.tcs.getPlayer(currentUnit.unitDef.playerId));
        this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
        this.iFrameItemplayer.setAttribute('class', 'unitHost');
        this.iFrameItemplayer.setAttribute('height', String(this.iFrameHostElement.clientHeight));

        if (this.tcs.hasUnitDefinition(this.myUnitNumber)) {
          this.pendingUnitDefinition = {tag: this.itemplayerSessionId, value: this.tcs.getUnitDefinition(this.myUnitNumber)};
        } else {
          this.pendingUnitDefinition = null;
        }

        if (this.tcs.hasUnitRestorePoint(this.myUnitNumber)) {
          this.pendingUnitRestorePoint = {tag: this.itemplayerSessionId, value: this.tcs.getUnitRestorePoint(this.myUnitNumber)};
        } else {
          this.pendingUnitRestorePoint = null;
        }

        this.leaveWarning = false;

        this.iFrameHostElement.appendChild(this.iFrameItemplayer);    }
    });
  }

  // ++++++++++++ page nav ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  setPageList(validPages: string[], currentPage: string) {
    if ((validPages instanceof Array)) {
      const newPageList: PageData[] = [];
      if (validPages.length > 1) {
        for (let i = 0; i < validPages.length; i++) {
          if (i === 0) {
            newPageList.push({
              index: -1,
              id: 'prev',
              disabled: validPages[i] === currentPage,
              type: 'prev'
            });
          }

          newPageList.push({
            index: i + 1,
            id: validPages[i],
            disabled: validPages[i] === currentPage,
            type: 'goto'
          });

          if (i === validPages.length - 1) {
            newPageList.push({
              index: -1,
              id: 'next',
              disabled: validPages[i] === currentPage,
              type: 'next'
            });
          }
        }
      }
      this.pageList = newPageList;

    } else if ((this.pageList.length > 1) && (currentPage !== undefined)) {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if (this.pageList[i].type === 'goto') {
          if (this.pageList[i].id === currentPage) {
            this.pageList[i].disabled = true;
            currentPageIndex = i;
          } else {
            this.pageList[i].disabled = false;
          }
        }
      }
      if (currentPageIndex === 1) {
        this.pageList[0].disabled = true;
        this.pageList[this.pageList.length - 1].disabled = false;
      } else {
        this.pageList[0].disabled = false;
        if (currentPageIndex === this.pageList.length - 2) {
          this.pageList[this.pageList.length - 1].disabled = true;
        } else {
          this.pageList[this.pageList.length - 1].disabled = false;
        }
      }
    }
    this.showPageNav = this.pageList.length > 0;
  }

  gotoPage(action: string, index: number) {
    let nextPageId = '';
    // currentpage is detected by disabled-attribute of page
    if (action === 'next') {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if ((this.pageList[i].index > 0) && (this.pageList[i].disabled)) {
          currentPageIndex = i;
          break;
        }
      }
      if ((currentPageIndex > 0) && (currentPageIndex < this.pageList.length - 2)) {
        nextPageId = this.pageList[currentPageIndex + 1].id;
      }
    } else if (action === 'prev') {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if ((this.pageList[i].index > 0) && (this.pageList[i].disabled)) {
          currentPageIndex = i;
          break;
        }
      }
      if (currentPageIndex > 1) {
        nextPageId = this.pageList[currentPageIndex - 1].id;
      }
    } else if (action === 'goto') {
      if ((index > 0) && (index < this.pageList.length - 1)) {
        nextPageId = this.pageList[index].id;
      }
    }

    if (nextPageId.length > 0) {
      this.postMessageTarget.postMessage({
        type: 'OpenCBA.ToItemPlayer.PageNavigationRequest',
        sessionId: this.itemplayerSessionId,
        newPage: nextPageId
      }, '*');
    }
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    if (this.postMessageSubscription !== null) {
      this.postMessageSubscription.unsubscribe();
    }
  }
}
