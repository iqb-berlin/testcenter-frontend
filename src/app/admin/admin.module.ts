import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { WorkspaceComponent } from './workspace.component';
import { DummyComponent } from './dummy/dummy.component';


@NgModule({
  declarations: [WorkspaceComponent, DummyComponent],
  imports: [
    CommonModule,
    AdminRoutingModule
  ],
  exports: [
    WorkspaceComponent,
    DummyComponent
  ]
})
export class AdminModule { }
