import { map } from 'rxjs/operators';
import { BackendService, ServerError } from '../backend.service';
import { BookletStatus } from '../app.interfaces';
// import { of } from 'rxjs';
// import { pipe } from '@angular/core/src/render3';

export class StartButtonData {
    id: string;
    label: string;
    filename: string;
    isEnabled: boolean;
    statustxt: string;
    lastUnit: number;

    constructor(
      id: string
    ) {
      this.id = id;
      this.label = '';
      this.filename = '';
      this.isEnabled = false;
      this.statustxt = 'Bitte warten';
    }

    public getBookletStatus(bs: BackendService, code = '') {
      return bs.getBookletStatus(this.id, code)
      .pipe(
        map(respDataUntyped => {
          let myreturn = false;
          if (respDataUntyped instanceof ServerError) {
            const e = respDataUntyped as ServerError;
            this.statustxt = e.code.toString() + ': ' + e.labelNice;
          } else {
            const respData = respDataUntyped as BookletStatus;
            this.statustxt = respData.statusLabel;
            this.isEnabled = respData.canStart;
            myreturn = respData.canStart;
            this.lastUnit = respData.lastUnit;
            this.label = respData.label;
          }
          return myreturn;
        })
      );
    }
  }
