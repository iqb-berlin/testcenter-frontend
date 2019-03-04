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
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReviewDialogComponent } from './review-dialog/review-dialog.component';
import { ReactiveFormsModule } from '../../../node_modules/@angular/forms';
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
    ReviewDialogComponent,
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
    TestControllerComponent
  ]
})
export class TestControllerModule { }
