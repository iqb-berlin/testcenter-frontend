import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';


export type FocusTarget =
    'tab'
    | 'host'
    | 'player'
    | 'outside';


@Injectable()
export class FocusService {
    public focus$: Subject<FocusTarget> = new Subject<FocusTarget>();
}
