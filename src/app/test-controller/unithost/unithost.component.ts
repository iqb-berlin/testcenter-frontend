import { MainDataService } from './../../maindata.service';
import { debounceTime, bufferTime, switchMap } from 'rxjs/operators';
import { TestControllerService } from './../test-controller.service';
import { Subscription, Subject } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Location } from '@angular/common';
import { TaggedString, PageData, LastStateKey, LogEntryKey } from '../test-controller.interfaces';

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

  private myUnitSequenceId = -1;
  private myUnitDbKey = '';
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
  private restorePoint$ = new Subject<string>();
  private restorePointSubscription: Subscription = null;
  private response$ = new Subject<TaggedString>();
  private responseSubscription: Subscription = null;



  constructor(
    private tcs: TestControllerService,
    private mds: MainDataService,
    private route: ActivatedRoute
  ) {
    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.restorePointSubscription = this.restorePoint$.pipe(
      debounceTime(300)).subscribe(restorePoint => {
        this.tcs.newUnitRestorePoint(this.myUnitDbKey, this.myUnitSequenceId, restorePoint, true);
      }
    );

    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.responseSubscription = this.response$.pipe(
      debounceTime(300)).subscribe(response => {
        this.tcs.newUnitResponse(this.myUnitDbKey, response.value, response.tag);
      }
    );

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
          case 'vo.FromPlayer.ReadyNotification':
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
            this.tcs.addUnitLog(this.myUnitDbKey, LogEntryKey.PAGENAVIGATIONSTART, '#first');

            this.postMessageTarget = m.source as Window;
            this.postMessageTarget.postMessage({
              type: 'vo.ToPlayer.DataTransfer',
              sessionId: this.itemplayerSessionId,
              unitDefinition: pendingUnitDef,
              restorePoint: pendingRestorePoint
            }, '*');

            break;

          // // // // // // //
          case 'vo.FromPlayer.StartedNotification':
            if (msgPlayerId === this.itemplayerSessionId) {
              this.setPageList(msgData['validPages'], msgData['currentPage']);
              this.tcs.addUnitLog(this.myUnitDbKey, LogEntryKey.PAGENAVIGATIONCOMPLETE, msgData['currentPage']);

              const canLeave = msgData['canLeave'];
              if (canLeave !== undefined) {
                if (canLeave as string === 'warning') {
                  this.leaveWarning = true;
                }
              }
            }
            break;

          // // // // // // //
          case 'vo.FromPlayer.ChangedDataTransfer':
            if (msgPlayerId === this.itemplayerSessionId) {
              this.setPageList(msgData['validPages'], msgData['currentPage']);
              if (msgData['currentPage'] !== undefined) {
                this.tcs.addUnitLog(this.myUnitDbKey, LogEntryKey.PAGENAVIGATIONCOMPLETE, msgData['currentPage']);
              }

              const restorePoint = msgData['restorePoint'] as string;
              if (restorePoint) {
                this.restorePoint$.next(restorePoint);
              }
              const response = msgData['response'] as string;
              if (response !== undefined) {
                this.response$.next({tag: msgData['responseType'], value: response});
              }
              const canLeaveChanged = msgData['canLeave'];
              if (canLeaveChanged !== undefined) {
                this.leaveWarning = (canLeaveChanged as string === 'warning');
              }
            }
            break;

          // // // // // // // ;-)
          case 'vo.FromPlayer.PageNavigationRequestedNotification':
            if (msgPlayerId === this.itemplayerSessionId) {
              this.gotoPage(msgData['newPage']);
            }
            break;

          // // // // // // //
          case 'vo.FromPlayer.NavigationRequestedNotification':
            if (msgPlayerId === this.itemplayerSessionId) {
              this.tcs.setUnitNavigationRequest(msgData['navigationTarget']);
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

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnInit() {
    this.iFrameHostElement = <HTMLElement>document.querySelector('#iFrameHost');

    this.iFrameItemplayer = null;
    this.leaveWarning = false;

    this.routingSubscription = this.route.params.subscribe(params => {
      this.myUnitSequenceId = Number(params['u']);
      this.tcs.currentUnitSequenceId = this.myUnitSequenceId;

      while (this.iFrameHostElement.hasChildNodes()) {
        this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
      }

      if ((this.myUnitSequenceId >= 1) && (this.myUnitSequenceId === this.myUnitSequenceId) && (this.tcs.rootTestlet !== null)) {
        this.tcs.setBookletState(LastStateKey.LASTUNIT, params['u']);

        const currentUnit = this.tcs.rootTestlet.getUnitAt(this.myUnitSequenceId);
        this.unitTitle = currentUnit.unitDef.title;
        this.myUnitDbKey = currentUnit.unitDef.alias;
        this.tcs.currentUnitDbKey = this.myUnitDbKey;
        this.tcs.currentUnitTitle = this.unitTitle;
        this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();

        this.setPageList([], '');

        this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
        this.iFrameItemplayer.setAttribute('srcdoc', this.tcs.getPlayer(currentUnit.unitDef.playerId));
        this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
        this.iFrameItemplayer.setAttribute('class', 'unitHost');
        this.iFrameItemplayer.setAttribute('height', String(this.iFrameHostElement.clientHeight));

        if (this.tcs.hasUnitDefinition(this.myUnitSequenceId)) {
          this.pendingUnitDefinition = {tag: this.itemplayerSessionId, value: this.tcs.getUnitDefinition(this.myUnitSequenceId)};
        } else {
          this.pendingUnitDefinition = null;
        }

        if (this.tcs.hasUnitRestorePoint(this.myUnitSequenceId)) {
          this.pendingUnitRestorePoint = {tag: this.itemplayerSessionId, value: this.tcs.getUnitRestorePoint(this.myUnitSequenceId)};
        } else {
          this.pendingUnitRestorePoint = null;
        }

        this.leaveWarning = false;

        this.iFrameHostElement.appendChild(this.iFrameItemplayer);
      }
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
              id: '#previous',
              disabled: validPages[i] === currentPage,
              type: '#previous'
            });
          }

          newPageList.push({
            index: i + 1,
            id: validPages[i],
            disabled: validPages[i] === currentPage,
            type: '#goto'
          });

          if (i === validPages.length - 1) {
            newPageList.push({
              index: -1,
              id: '#next',
              disabled: validPages[i] === currentPage,
              type: '#next'
            });
          }
        }
      }
      this.pageList = newPageList;

    } else if ((this.pageList.length > 1) && (currentPage !== undefined)) {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if (this.pageList[i].type === '#goto') {
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

  gotoPage(action: string, index = 0) {
    let nextPageId = '';
    // currentpage is detected by disabled-attribute of page
    if (action === '#next') {
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
    } else if (action === '#previous') {
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
    } else if (action === '#goto') {
      if ((index > 0) && (index < this.pageList.length - 1)) {
        nextPageId = this.pageList[index].id;
      }
    } else if (index === 0) {
      // call from player
      nextPageId = action;
    }

    if (nextPageId.length > 0) {
      this.tcs.addUnitLog(this.myUnitDbKey, LogEntryKey.PAGENAVIGATIONSTART, nextPageId);
      this.postMessageTarget.postMessage({
        type: 'vo.ToPlayer.PageNavigationRequest',
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
    if (this.restorePointSubscription !== null) {
      this.restorePointSubscription.unsubscribe();
    }
    if (this.responseSubscription !== null) {
      this.responseSubscription.unsubscribe();
    }
  }
}
