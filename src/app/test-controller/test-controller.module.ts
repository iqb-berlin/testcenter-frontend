export { TestControllerService, SessionDataToSend } from './test-controller.service';
import { BackendService } from './backend.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestControllerRoutingModule } from './test-controller-routing.module';
import { UnithostComponent } from './unithost/unithost.component';
import { MatProgressSpinnerModule, MatIconModule } from '@angular/material';
import { TestControllerComponent } from './test-controller.component';
import { ResizeIFrameChildDirective } from './resize-IFrameChild/resize-IFrameChild.directive';
import { routingProviders } from './unithost/unit-routing';
import { TcStatustextComponent } from './tc-statustext/tc-statustext.component';
import { TcMenuButtonsComponent } from './tc-menu-buttons/tc-menu-buttons.component';
import { TcNaviButtonsComponent } from './tc-navi-buttons/tc-navi-buttons.component';


@NgModule({
  imports: [
    CommonModule,
    TestControllerRoutingModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  declarations: [
    UnithostComponent,
    TestControllerComponent,
    ResizeIFrameChildDirective,
    TcStatustextComponent,
    TcMenuButtonsComponent,
    TcNaviButtonsComponent
  ],
  providers: [
    BackendService,
    routingProviders
  ],
  exports: [
    TestControllerComponent,
    TcStatustextComponent,
    TcNaviButtonsComponent,
    TcMenuButtonsComponent
  ]
})
export class TestControllerModule { }
