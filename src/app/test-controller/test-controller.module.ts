import {IqbComponentsModule} from 'iqb-components';

export {TestControllerService} from './test-controller.service';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {TestControllerRoutingModule} from './test-controller-routing.module';
import {UnithostComponent} from './unithost/unithost.component';
import {TestControllerComponent} from './test-controller.component';
import {unitRouteGuards} from './unithost/unit-route-guards';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ReviewDialogComponent} from './review-dialog/review-dialog.component';
import {ReactiveFormsModule} from '@angular/forms';
import {StartLockInputComponent} from './start-lock-input/start-lock-input.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {MatCardModule} from '@angular/material/card';
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {TestStatusComponent} from './test-status/test-status.component';
import {FocusService} from './focus.service';
import {CommandService} from './command.service';


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
    MatCardModule,
    MatDialogModule,
    MatProgressBarModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    IqbComponentsModule.forChild()
  ],
  declarations: [
    UnithostComponent,
    TestControllerComponent,
    ReviewDialogComponent,
    StartLockInputComponent,
    TestStatusComponent,
  ],
  entryComponents: [
    ReviewDialogComponent,
    StartLockInputComponent
  ],
  providers: [
    unitRouteGuards,
    FocusService,
    CommandService
  ],
  exports: [
    TestControllerComponent
  ]
})
export class TestControllerModule {
  // noinspection JSUnusedLocalSymbols
  constructor(
      private focusService: FocusService,
      private commandService: CommandService
  ) {
  }
}
