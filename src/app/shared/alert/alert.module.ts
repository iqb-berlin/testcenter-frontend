import { NgModule } from '@angular/core';
import { AlertComponent } from './alert.component';
import {MatIconModule} from '@angular/material/icon';

@NgModule({
    imports: [
        MatIconModule
    ],
  exports: [
    AlertComponent
  ],
  declarations: [AlertComponent]
})
export class AlertModule { }
