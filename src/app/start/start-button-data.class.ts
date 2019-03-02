import { BackendService, ServerError } from '../backend.service';
import { BookletStatus } from '../app.interfaces';

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
      bs.getBookletStatus(this.id, code).subscribe(respDataUntyped => {
        if (respDataUntyped instanceof ServerError) {
          const e = respDataUntyped as ServerError;
          this.statustxt = e.code.toString() + ': ' + e.labelNice;
        } else {
          const respData = respDataUntyped as BookletStatus;
          this.statustxt = respData.statusLabel;
          this.isEnabled = respData.canStart;
          this.lastUnit = respData.lastUnit;
          this.label = respData.label;
        }
      });
    }
  }
