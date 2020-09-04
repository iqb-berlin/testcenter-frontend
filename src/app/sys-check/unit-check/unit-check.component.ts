import { MainDataService } from '../../maindata.service';
import { BackendService } from '../backend.service';
import { SysCheckDataService } from '../sys-check-data.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Subscription} from 'rxjs';
import {UnitAndPlayerContainer} from '../sys-check.interfaces';
import { ServerError } from 'iqb-components';

declare var srcDoc: any;

@Component({
  selector: 'iqb-unit-check',
  templateUrl: './unit-check.component.html',
  styleUrls: ['./unit-check.component.css']
})
export class UnitCheckComponent implements OnInit, OnDestroy {
  @ViewChild('iFrameHost', {static: true}) iFrameHostElement: ElementRef;

  public pageList: PageData[] = [];
  private iFrameItemplayer: HTMLIFrameElement = null;
  private postMessageSubscription: Subscription = null;
  private taskSubscription: Subscription = null;
  private postMessageTarget: Window = null;
  private itemplayerSessionId = '';

  private pendingUnitDef = '';
  waitForLoading = true;

  public errorMessage = '';

  constructor(
    private ds: SysCheckDataService,
    private bs: BackendService,
    private mds: MainDataService
  ) {
  }

  ngOnInit() {
    this.taskSubscription = this.ds.task$.subscribe((task) => {
        if (task === 'loadunit') {
            this.loadUnitAndPlayer();
        }
    });
    this.postMessageSubscription = this.mds.postMessage$.subscribe((m: MessageEvent) => {
      const msgData = m.data;
      const msgType = msgData['type'];
      console.log(msgData);

      if ((msgType !== undefined) && (msgType !== null)) {
        switch (msgType) {

          case 'vopReadyNotification':
            this.iFrameItemplayer.setAttribute('height', String(Math.trunc(this.iFrameHostElement.nativeElement.clientHeight)));
            this.postMessageTarget = m.source as Window;
            if (typeof this.postMessageTarget !== 'undefined') {
              this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();
              this.postMessageTarget.postMessage({
                type: 'vopStartCommand',
                sessionId: this.itemplayerSessionId,
                unitDefinition: this.pendingUnitDef,
                playerConfig: {
                  logPolicy: 'disabled',
                  stateReportPolicy: 'none'
                }
              }, '*');
            }
            break;

          case 'vopStateChangedNotification':
            if (msgData['playerState']) {
              const playerState = msgData['playerState'];
              this.setPageList(Object.keys(playerState.validPages), playerState.currentPage);
            }
            break;

          default:
            console.log('processMessagePost ignored message: ' + msgType);
            break;
        }
      }
    });
  }

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
        this.pageList[this.pageList.length - 1].disabled = currentPageIndex === this.pageList.length - 2;
      }
    }
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
      if (typeof this.postMessageTarget !== 'undefined') {
        this.postMessageTarget.postMessage({
          type: 'vopPageNavigationCommand',
          sessionId: this.itemplayerSessionId,
          target: nextPageId
        }, '*');
      }
    }
  }

  private loadUnitAndPlayer(): void {
    while (this.iFrameHostElement.nativeElement.hasChildNodes()) {
      this.iFrameHostElement.nativeElement.removeChild(this.iFrameHostElement.nativeElement.lastChild);
    }
    this.bs.getUnitAndPlayer(this.ds.checkConfig.workspaceId, this.ds.checkConfig.name).subscribe((unitAndPlayer: UnitAndPlayerContainer | ServerError) => {
      if (unitAndPlayer instanceof ServerError) {
        this.errorMessage = 'Konnte Unit-Player nicht laden: ' + unitAndPlayer.labelNice;
        this.ds.unitData$.next([
          {id: '0', type: 'unit/player', label: 'loading error', value: 'Error: ' + unitAndPlayer.labelSystem, warning: true}
        ]);
        return '';
      }

      if (unitAndPlayer.player.length === 0) {
        this.errorMessage = 'Konnte Unit-Player nicht laden';
        this.ds.unitData$.next([
          {id: '0', type: 'unit/player', label: 'loading error', warning: true, value: 'Response invalid'},
          {id: '0', type: 'unit/player', label: 'loading time', value: unitAndPlayer.duration.toString(), warning: false}
        ]);
        console.warn(unitAndPlayer);
        return '';
      }

      this.ds.unitData$.next([
        {id: '0', type: 'unit/player', label: 'loading time', value: unitAndPlayer.duration.toString(), warning: false}
      ]);

      this.pendingUnitDef = unitAndPlayer.def;
      this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
      // this.iFrameItemplayer.setAttribute('srcdoc', playerCode);
      this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
      this.iFrameItemplayer.setAttribute('class', 'unitHost');
      this.iFrameItemplayer.setAttribute('height', '100');
      this.iFrameHostElement.nativeElement.appendChild(this.iFrameItemplayer);
      srcDoc.set(this.iFrameItemplayer, unitAndPlayer.player);

      this.ds.nextTask();
      this.waitForLoading = false
  });
  }

  ngOnDestroy() {
    if (this.taskSubscription !== null) {
      this.taskSubscription.unsubscribe();
    }
    if (this.postMessageSubscription !== null) {
      this.postMessageSubscription.unsubscribe();
    }
  }
}

export interface PageData {
  index: number;
  id: string;
  type: '#next' | '#previous' | '#goto';
  disabled: boolean;
}
