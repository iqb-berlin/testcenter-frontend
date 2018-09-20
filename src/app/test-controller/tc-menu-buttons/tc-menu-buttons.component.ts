import { Component, OnInit } from '@angular/core';
import { TestControllerService } from '../test-controller.service';

@Component({
  selector: 'tc-menu-buttons',
  templateUrl: './tc-menu-buttons.component.html',
  styleUrls: ['./tc-menu-buttons.component.css']
})
export class TcMenuButtonsComponent implements OnInit {
  private showTestStartMenuEntry = false;
  private showReviewMenuEntry = false;

  constructor(
    private tcs: TestControllerService
  ) { }

  ngOnInit() {
    this.tcs.canLeaveTest$.subscribe(can => this.showTestStartMenuEntry = can);
    this.tcs.isReviewMode$.subscribe(is => this.showReviewMenuEntry = is);
  }

}
