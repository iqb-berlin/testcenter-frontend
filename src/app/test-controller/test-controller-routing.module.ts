import { UnitActivateGuard, UnitDeactivateGuard } from './unithost/unit-routing-guards';
import { UnithostComponent } from './unithost/unithost.component';
import { TestControllerComponent } from './test-controller.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {NoUnitComponent} from "./no-unit/no-unit.component";



const routes: Routes = [
  {
    path: ':t',
    component: TestControllerComponent,
    children: [
      {
        path: 'u/:u',
          component: UnithostComponent,
          canActivate: [UnitActivateGuard],
          canDeactivate: [UnitDeactivateGuard]
      },
      {
        path: 'nu/:f',
        component: NoUnitComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestControllerRoutingModule { }
