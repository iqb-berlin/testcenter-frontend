import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from "@angular/router";
import {MainDataService} from "./maindata.service";
import {Observable} from "rxjs";

@Injectable()
export class AdminRouteActivateGuard implements CanActivate {
  constructor(
    private mds: MainDataService,
  ) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    return true;
  }
}
