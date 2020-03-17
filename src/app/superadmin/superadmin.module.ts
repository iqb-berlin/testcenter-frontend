import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperadminRoutingModule } from './superadmin-routing.module';
import { SuperadminComponent } from './superadmin.component';
import {UsersComponent} from "./users/users.component";
import {WorkspacesComponent} from "./workspaces/workspaces.component";


@NgModule({
  declarations: [
    SuperadminComponent,
    UsersComponent,
    WorkspacesComponent],
  imports: [
    CommonModule,
    SuperadminRoutingModule
  ],
  exports: [
    SuperadminComponent
  ]
})
export class SuperadminModule { }
