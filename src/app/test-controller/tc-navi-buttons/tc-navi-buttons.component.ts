import { TestControllerService } from './../test-controller.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tc-navi-buttons',
  templateUrl: './tc-navi-buttons.component.html',
  styleUrls: ['./tc-navi-buttons.component.css']
})
export class TcNaviButtonsComponent {
  private showNaviButtons = false;
  private showPageNaviButtons = false;
  private pagePrevEnabled = false;
  private pageNextEnabled = false;
  private unitPrevEnabled = false;
  private unitNextEnabled = false;

  constructor( private tcs: TestControllerService) {
      this.tcs.showNaviButtons$.subscribe(show => this.showNaviButtons = show);
      this.tcs.itemplayerValidPages$.subscribe((pages: string[]) => this.showPageNaviButtons = pages.length  > 1);
      this.tcs.itemplayerCurrentPage$.subscribe((p: string) => {
        const validPages = this.tcs.itemplayerValidPages$.getValue();
        const pagePos = validPages.indexOf(p);

        this.pageNextEnabled = (pagePos >= 0) && (pagePos < validPages.length - 1);
        this.pagePrevEnabled = (pagePos > 0) && (validPages.length > 1);
      });
      this.tcs.nextUnit$.subscribe(u => {
        this.unitNextEnabled = u >= 0;
      });
      this.tcs.prevUnit$.subscribe(u => this.unitPrevEnabled = u >= 0);
    }

  // *******************************************************************************************************
  prevPageNaviButtonClick() {
    const validPages = this.tcs.itemplayerValidPages$.getValue();
    const p = this.tcs.itemplayerCurrentPage$.getValue();
    const pagePos = validPages.indexOf(p);
    if (pagePos > 0) {
      this.tcs.itemplayerPageRequest$.next(validPages[pagePos - 1]);
    }
  }
  nextPageNaviButtonClick() {
    const validPages = this.tcs.itemplayerValidPages$.getValue();
    const p = this.tcs.itemplayerCurrentPage$.getValue();
    const pagePos = validPages.indexOf(p);
    if ((pagePos >= 0) && (pagePos < validPages.length - 1)) {
      this.tcs.itemplayerPageRequest$.next(validPages[pagePos + 1]);
    }
  }
  nextUnitNaviButtonClick() {
    this.tcs.unitRequest$.next(this.tcs.nextUnit$.getValue());
  }
  prevUnitNaviButtonClick() {
    this.tcs.unitRequest$.next(this.tcs.prevUnit$.getValue());
  }
}
