export { TestControllerService } from './test-controller.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestControllerRoutingModule } from './test-controller-routing.module';
import { UnithostComponent } from './unithost/unithost.component';
import { MatProgressSpinnerModule, MatIconModule, MatMenuModule, MatTooltipModule, MatButtonModule,
  MatDialogModule, MatSnackBarModule, MatCheckboxModule, MatRadioModule, MatFormFieldModule, MatInputModule } from '@angular/material';
import { TestControllerComponent } from './test-controller.component';
import { ResizeIFrameChildDirective } from './resize-IFrameChild/resize-IFrameChild.directive';
import { unitRoutingGuards } from './unithost/unit-routing-guards';
import { TcMenuButtonsComponent } from './tc-menu-buttons/tc-menu-buttons.component';
// import { TcNaviButtonsComponent } from './tc-navi-buttons/tc-navi-buttons.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReviewDialogComponent } from './tc-menu-buttons/review-dialog.component';
import { ReactiveFormsModule } from '../../../node_modules/@angular/forms';
// import { TcSidenaviButtonComponent } from './tc-sidenavi-button/tc-sidenavi-button.component';
import { StartLockInputComponent } from './start-lock-input/start-lock-input.component';


@NgModule({
  imports: [
    CommonModule,
    TestControllerRoutingModule,
    MatProgressSpinnerModule,
    FlexLayoutModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatRadioModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule
  ],
  declarations: [
    UnithostComponent,
    TestControllerComponent,
    ResizeIFrameChildDirective,
    TcMenuButtonsComponent,
    // TcNaviButtonsComponent,
    ReviewDialogComponent,
    // TcSidenaviButtonComponent,
    StartLockInputComponent
  ],
  entryComponents: [
    ReviewDialogComponent,
    StartLockInputComponent
  ],
  providers: [
    unitRoutingGuards
  ],
  exports: [
    TestControllerComponent,
    // TcNaviButtonsComponent,
    TcMenuButtonsComponent
  ]
})
export class TestControllerModule { }
