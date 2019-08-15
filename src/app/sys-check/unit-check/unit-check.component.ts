import { MainDataService } from '../../maindata.service';
import { BackendService, UnitData } from '../backend.service';
import { SyscheckDataService } from '../syscheck-data.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription, BehaviorSubject, Observable } from 'rxjs';
import { delay, flatMap, map } from 'rxjs/operators';
import { ServerError } from '../../backend.service';
import { TaggedString } from '../../test-controller/test-controller.interfaces';

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

  public dataLoading = false;

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
          type: 'vo.ToPlayer.PageNavigationRequest',
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
          case 'vo.FromPlayer.ReadyNotification':
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
                type: 'vo.ToPlayer.DataTransfer',
                sessionId: this.itemplayerSessionId,
                unitDefinition: pendingSpec
              }, '*');
            }
            break;

          // // // // // // //
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
            break;

          // // // // // // //
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

          // // // // // // //
          default:
            console.log('processMessagePost ignored message: ' + msgType);
            break;
        }
      }
    });
  }


  public loadUnitandPlayer(checkId: string): void{

    this.clearPlayerElement();
    this.bs.getUnitData(checkId).pipe(
      flatMap((data: UnitData) => this.loadPlayerCode(data)),
      map((playerCode: string) => this.createPlayerElement(playerCode)),
    ).subscribe();
  }

  private loadPlayerCode(data: UnitData): Observable<string> {

    return this.bs.getResource('', BackendService.normaliseId(data.player, 'html'), true)
      .pipe(
        map((player: TaggedString | ServerError) => {

          if (player instanceof ServerError) {
            throw new Error(player.labelNice);
          }

          if (player.value.length === 0) {
            throw new Error('## size of player "' + data.player + '" = 0');
          }

          this.pendingItemDefinition$.next(data.def);
          return player.value;
        })
      );

  }

  private clearPlayerElement(): void  {

    this.dataLoading = true;

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
    this.dataLoading = false;
  }

  ngOnDestroy() {
    this.postMessageSubscription.unsubscribe();
  }
}
