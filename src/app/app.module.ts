import { AboutComponent } from './about/about.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { NgModule, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BackendService } from './backend.service';

import { MatButtonModule, MatCheckboxModule, MatMenuModule, MatTooltipModule,
  MatToolbarModule, MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatTabsModule, MatCardModule, MatProgressSpinnerModule } from '@angular/material';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { IqbCommonModule } from './iqb-common';
import { WorkspaceModule } from './workspace';
import { StartComponent } from './start/start.component';
import { SuperadminModule } from './superadmin';
import { FlexLayoutModule } from "@angular/flex-layout";
import { httpInterceptorProviders } from './app.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    StartComponent,
    AboutComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    MatButtonModule,
    MatFormFieldModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    FlexLayoutModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDialogModule,
    MatTabsModule,
    ReactiveFormsModule,
    HttpClientModule,
    WorkspaceModule,
    SuperadminModule,
    AppRoutingModule,
    IqbCommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    FlexLayoutModule
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    },
    BackendService,
    httpInterceptorProviders
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
