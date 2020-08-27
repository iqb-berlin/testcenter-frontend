import { UnitActivateGuard, UnitDeactivateGuard } from './unithost/unit-route-guards';
import { UnithostComponent } from './unithost/unithost.component';
import { TestControllerComponent } from './test-controller.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {TestStatusComponent} from './test-status/test-status.component';
import {TestControllerDeactivateGuard, TestControllerErrorPausedActivateGuard} from './test-controller-route-guards';
import {UnlockInputComponent} from "./unlock-input/unlock-input.component";
import {UnitMenuComponent} from "./unit-menu/unit-menu.component";

const routes: Routes = [
  {
    path: ':t',
    component: TestControllerComponent,
    canDeactivate: [TestControllerDeactivateGuard],
    children: [
      {
        path: '',
        redirectTo: 'status',
        pathMatch: 'full'
      },
      {
        path: 'unlock',
        component: UnlockInputComponent
      },
      {
        path: 'status',
        component: TestStatusComponent
      },
      {
        path: 'menu',
        component: UnitMenuComponent,
        canActivate: [TestControllerErrorPausedActivateGuard]
      },
      {
        path: 'u/:u',
        component: UnithostComponent,
        canActivate: [TestControllerErrorPausedActivateGuard, UnitActivateGuard],
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
