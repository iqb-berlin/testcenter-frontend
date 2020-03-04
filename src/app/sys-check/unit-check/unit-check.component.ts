import { MainDataService } from '../../maindata.service';
import { BackendService } from '../backend.service';
import { SysCheckDataService } from '../sys-check-data.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Subscription, BehaviorSubject, combineLatest} from 'rxjs';
import { UnitData } from '../sys-check.interfaces';
import { ServerError } from 'iqb-components';

@Component({
  selector: 'iqb-unit-check',
  templateUrl: './unit-check.component.html',
  styleUrls: ['./unit-check.component.css']
})
export class UnitCheckComponent implements OnInit, OnDestroy {
  @ViewChild('iFrameHost', {static: true}) iFrameHostElement: ElementRef;

  private iFrameItemplayer: HTMLIFrameElement = null;
  private postMessageSubscription: Subscription = null;
  private taskSubscription: Subscription = null;
  private itemplayerPageRequestSubscription = null;
  private itemplayerSessionId = '';
  private postMessageTarget: Window = null;

  private pendingItemDefinition$ = new BehaviorSubject(null);
  waitforloading = true;

  public errorMessage = '';

  constructor(
    private ds: SysCheckDataService,
    private bs: BackendService,
    private mds: MainDataService
  ) {
  }

  ngOnInit() {

    this.taskSubscription = combineLatest(
      this.ds.task$,
      this.ds.checkConfig$
      ).subscribe(([task, checkConfig]) => {
        if (task === 'loadunit') {
            this.loadUnitAndPlayer(checkConfig.id);
        }
    });

    this.itemplayerPageRequestSubscription = this.ds.itemplayerPageRequest$.subscribe((newPage: string) => {
      if (newPage.length > 0) {
        this.postMessageTarget.postMessage({
          type: 'vo.ToPlayer.NavigateToPage',
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

          case 'vo.FromPlayer.ReadyNotification':
            this.iFrameItemplayer.setAttribute('height', String(Math.trunc(this.iFrameHostElement.nativeElement.clientHeight)));
            let hasData = false;

            const pendingSpec = this.pendingItemDefinition$.getValue();
            if ((pendingSpec !== null) && (pendingSpec.length > 0)) {
              hasData = true;
              this.pendingItemDefinition$.next(null);
            }

            if (hasData) {
              this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();
              this.postMessageTarget = m.source as Window;
              this.postMessageTarget.postMessage({
                type: 'vo.ToPlayer.DataTransfer',
                sessionId: this.itemplayerSessionId,
                unitDefinition: pendingSpec
              }, '*');
            }
            break;

          case 'vo.FromPlayer.StartedNotification':
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
            this.waitforloading = false;
            break;

          case 'vo.FromPlayer.ChangedDataTransfer':
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

          default:
            console.log('processMessagePost ignored message: ' + msgType);
            break;
        }
      }
    });
  }


  public loadUnitAndPlayer(checkId: string): void {

    this.clearPlayerElement();
    this.bs.getUnitAndPlayer(checkId).subscribe((unitAndPlayer: UnitData | ServerError) => {

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

      this.pendingItemDefinition$.next(unitAndPlayer.def);
      this.createPlayerElement(unitAndPlayer.player);

      this.ds.nextTask();
  });
  }


  private clearPlayerElement(): void  {
    while (this.iFrameHostElement.nativeElement.hasChildNodes()) {
      this.iFrameHostElement.nativeElement.removeChild(this.iFrameHostElement.nativeElement.lastChild);
    }
  }

  private createPlayerElement(playerCode: string): void {

    this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
    this.iFrameItemplayer.setAttribute('srcdoc', playerCode);
    this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
    this.iFrameItemplayer.setAttribute('class', 'unitHost');
    this.iFrameItemplayer.setAttribute('height', '100');
    this.iFrameHostElement.nativeElement.appendChild(this.iFrameItemplayer);
  }

  ngOnDestroy() {
    if (this.taskSubscription !== null) {
      this.taskSubscription.unsubscribe();
    }
    if (this.itemplayerPageRequestSubscription !== null) {
      this.itemplayerPageRequestSubscription.unsubscribe();
    }
    if (this.postMessageSubscription !== null) {
      this.postMessageSubscription.unsubscribe();
    }
  }
}
