import { UnitActivateGuard, UnitDeactivateGuard } from './unithost/unit-routing-guards';
import { UnithostComponent } from './unithost/unithost.component';
import { TestControllerComponent } from './test-controller.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';



const routes: Routes = [
  {
    path: '',
    component: TestControllerComponent,
    children: [
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
