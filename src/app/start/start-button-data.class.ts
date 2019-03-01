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
      id: string,
      label: string,
      filename: string
    ) {
      this.id = id;
      this.label = label;
      this.filename = filename;
      this.isEnabled = false;
      this.statustxt = 'Bitte warten';
    }

    public getBookletStatusByLoginToken(bs: BackendService, loginToken: string, code: string) {
      bs.getBookletStatus(code, this.id, this.label).subscribe(respDataUntyped => {
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

    public getBookletStatusByPersonToken(bs: BackendService, personToken: string) {
      bs.getBookletStatus('', this.id, '').subscribe(respDataUntyped => {
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
