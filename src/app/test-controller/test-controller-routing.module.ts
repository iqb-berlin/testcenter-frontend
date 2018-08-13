import { UnitActivateGuard, UnitDeactivateGuard, UnitResolver } from './unithost/unit-routing';
import { UnithostComponent } from './unithost/unithost.component';
import { TestControllerComponent } from './test-controller.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';



const routes: Routes = [
  {
    path: 't',
    component: TestControllerComponent,
    children: [
//      {path: '', redirectTo: 'u/0', pathMatch: 'full'},
//      {path: 'u', redirectTo: 'u/0', pathMatch: 'full'},
      {path: 'u/:u',
        component: UnithostComponent,
        // canActivate: [UnitActivateGuard],
        // canDeactivate: [UnitDeactivateGuard],
        resolve: {
          unit: UnitResolver
        }
      }
    ]
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestControllerRoutingModule { }
