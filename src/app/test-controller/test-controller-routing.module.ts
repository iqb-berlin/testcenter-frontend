import { UnitActivateGuard, UnitDeactivateGuard } from './unithost/unit-route-guards';
import { UnithostComponent } from './unithost/unithost.component';
import { TestControllerComponent } from './test-controller.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {TestStatusComponent} from './test-status/test-status.component';
import {TestControllerDeactivateGuard} from './test-controller-route-guards';
import {UnlockInputComponent} from "./unlock-input/unlock-input.component";

const routes: Routes = [
  {
    path: ':t',
    component: TestControllerComponent,
    canDeactivate: [TestControllerDeactivateGuard],
    children: [
      {
        path: '',
        component: TestStatusComponent
      },
      {
        path: 'unlock',
        component: UnlockInputComponent
      },
      {
        path: 'u/:u',
        component: UnithostComponent,
        canActivate: [UnitActivateGuard],
        canDeactivate: [UnitDeactivateGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestControllerRoutingModule { }
