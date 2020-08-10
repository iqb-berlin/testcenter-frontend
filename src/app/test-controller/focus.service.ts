import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';


export type FocusStatus =
    'tab'
    | 'host'
    | 'player'
    | 'outside'
    | 'closed_window';


@Injectable()
export class FocusService {
    public status$: Subject<FocusStatus> = new Subject<FocusStatus>();
}
