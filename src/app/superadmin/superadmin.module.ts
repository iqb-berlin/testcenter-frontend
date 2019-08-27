import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTabsModule, MatButtonModule, MatIconModule, MatToolbarModule,
  MatCheckboxModule, MatSortModule, MatDialogModule, MatTooltipModule, MatSnackBarModule,
  MatSelectModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule } from '@angular/material';
  import {FlexLayoutModule} from '@angular/flex-layout';
  import { ReactiveFormsModule } from '@angular/forms';

import { SuperadminRoutingModule } from './superadmin-routing.module';
import { WorkspacesComponent } from './workspaces/workspaces.component';
import { UsersComponent } from './users/users.component';
import { SuperadminComponent } from './superadmin.component';
import { BackendService } from './backend.service';
import { IqbFilesModule } from '../iqb-files/iqb-files.module';
import { IqbComponents } from 'iqb-components';
import { NewuserComponent } from './users/newuser/newuser.component';
import { NewpasswordComponent } from './users/newpassword/newpassword.component';
import { NewworkspaceComponent } from './workspaces/newworkspace/newworkspace.component';
import { EditworkspaceComponent } from './workspaces/editworkspace/editworkspace.component';


@NgModule({
  imports: [
    CommonModule,
    SuperadminRoutingModule,
    IqbFilesModule,
    IqbComponents,
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSortModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatSnackBarModule,
    FlexLayoutModule
  ],
  exports: [
    SuperadminComponent,
  ],
  declarations: [
    WorkspacesComponent,
    UsersComponent,
    SuperadminComponent,
    NewuserComponent,
    NewpasswordComponent,
    NewworkspaceComponent,
    EditworkspaceComponent
  ],
  providers: [
    BackendService,
  ],
  entryComponents: [
    NewuserComponent,
    NewpasswordComponent,
    NewworkspaceComponent,
    EditworkspaceComponent
  ]
})
export class SuperadminModule { }
