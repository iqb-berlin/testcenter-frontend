import { SysCheckDataService } from '../../sys-check-data.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tc-navi-buttons',
  templateUrl: './unit-navi-buttons.component.html',
  styleUrls: ['./unit-navi-buttons.component.css']
})
export class UnitNaviButtonsComponent {
  public showPageNaviButtons = true;
  private pagePrevEnabled = false;
  private pageNextEnabled = false;

  constructor(private ds: SysCheckDataService) {

    this.ds.itemplayerValidPages$.subscribe((pages: string[]) => this.showPageNaviButtons = pages.length  > 1);
    this.ds.itemplayerCurrentPage$.subscribe((p: string) => {
      const validPages = this.ds.itemplayerValidPages$.getValue();
      const pagePos = validPages.indexOf(p);

      this.pageNextEnabled = (pagePos >= 0) && (pagePos < validPages.length - 1);
      this.pagePrevEnabled = (pagePos > 0) && (validPages.length > 1);
    });
  }

  prevPageNaviButtonClick() {

    const validPages = this.ds.itemplayerValidPages$.getValue();
    const p = this.ds.itemplayerCurrentPage$.getValue();
    const pagePos = validPages.indexOf(p);
    if (pagePos > 0) {
      this.ds.itemplayerPageRequest$.next(validPages[pagePos - 1]);
    }
  }
  nextPageNaviButtonClick() {

    const validPages = this.ds.itemplayerValidPages$.getValue();
    const p = this.ds.itemplayerCurrentPage$.getValue();
    const pagePos = validPages.indexOf(p);
    if ((pagePos >= 0) && (pagePos < validPages.length - 1)) {
      this.ds.itemplayerPageRequest$.next(validPages[pagePos + 1]);
    }
  }
}
