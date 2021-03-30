import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IqbComponentsModule } from 'iqb-components';
import { CommonModule } from '@angular/common';
import { AlertComponent } from './alert.component';

@NgModule({
  imports: [
    MatIconModule,
    IqbComponentsModule,
    CommonModule
  ],
  exports: [
    AlertComponent
  ],
  declarations: [AlertComponent]
})
export class AlertModule { }
