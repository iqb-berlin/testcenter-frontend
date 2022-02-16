import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogData } from './interfaces/confirm-dialog.interfaces';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
import { MessageDialogData, MessageType } from './interfaces/message-dialog.interfaces';
import { BytesPipe } from './pipes/bytes/bytes.pipe';
import { CustomtextPipe } from './pipes/customtext/customtext.pipe';
import { CustomtextService } from './services/customtext/customtext.service';
import { CustomTextData, CustomTextDefs } from './interfaces/customtext.interfaces';
import { AlertComponent } from './components/alert/alert.component';
import { WebsocketService } from './services/websocket/websocket.service';
import { WebsocketBackendService } from './services/websocket-backend/websocket-backend.service';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatExpansionModule,
    FormsModule,
    MatInputModule,
    HttpClientModule
  ],
  entryComponents: [
    ConfirmDialogComponent,
    MessageDialogComponent
  ],
  declarations: [
    ConfirmDialogComponent,
    MessageDialogComponent,
    BytesPipe,
    CustomtextPipe,
    AlertComponent
  ],
  exports: [
    ConfirmDialogComponent,
    MessageDialogComponent,
    BytesPipe,
    CustomtextPipe,
    AlertComponent
  ],
  providers: [
    CustomtextService,
    WebsocketService
  ]
})
export class SharedModule {}
export { CustomtextService } from './services/customtext/customtext.service';
export { WebsocketBackendService } from './services/websocket-backend/websocket-backend.service';
export { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
export { MessageDialogData, MessageType } from './interfaces/message-dialog.interfaces';
export { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
export { ConfirmDialogData } from './interfaces/confirm-dialog.interfaces';
export { AlertComponent } from './components/alert/alert.component';
export { CustomtextPipe } from './pipes/customtext/customtext.pipe';
export { ConnectionStatus } from './interfaces/websocket-backend.interfaces';
