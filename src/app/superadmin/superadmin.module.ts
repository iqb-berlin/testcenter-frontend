import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperadminRoutingModule } from './superadmin-routing.module';
import { SuperadminComponent } from './superadmin.component';
import { UsersComponent } from "./users/users.component";
import { WorkspacesComponent } from "./workspaces/workspaces.component";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';


@NgModule({
  declarations: [
    SuperadminComponent,
    UsersComponent,
    WorkspacesComponent
  ],
  imports: [
    CommonModule,
    SuperadminRoutingModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule
  ],
  exports: [
    SuperadminComponent
  ]
})
export class SuperadminModule { }
