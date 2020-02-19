import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {WorkspaceComponent} from "./workspace.component";
import {DummyComponent} from "./dummy/dummy.component";


const routes: Routes = [
  {
    path: ':ws',
    component: WorkspaceComponent,
    children: [
      {path: '', redirectTo: 'monitor', pathMatch: 'full'},
      {path: 'files', component: DummyComponent},
      {path: 'syscheck', component: DummyComponent},
      {path: 'monitor', component: DummyComponent},
      {path: 'results', component: DummyComponent},
      {path: '**', component: DummyComponent}
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
