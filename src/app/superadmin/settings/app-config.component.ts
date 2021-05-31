import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppConfig } from '../../config/app.config';
import { MainDataService } from '../../maindata.service';
import { BackendService } from '../backend.service';

@Component({
  selector: 'app-app-config',
  templateUrl: 'app-config.component.html',
  styles: [
    '.example-chip-list {width: 100%;}',
    '.block-ident {margin-left: 40px}',
    '.warning-warning { color: darkgoldenrod }'
  ]
})

export class AppConfigComponent implements OnInit, OnDestroy {
  configForm: FormGroup;
  dataChanged = false;
  private configDataChangedSubscription: Subscription = null;
  warningIsExpired = false;
  expiredHours = {
    '': '',
    '01': '01:00 Uhr',
    '02': '02:00 Uhr',
    '03': '03:00 Uhr',
    '04': '04:00 Uhr',
    '05': '05:00 Uhr',
    '06': '06:00 Uhr',
    '07': '07:00 Uhr',
    '08': '08:00 Uhr',
    '09': '09:00 Uhr',
    10: '10:00 Uhr',
    11: '11:00 Uhr',
    12: '12:00 Uhr',
    13: '13:00 Uhr',
    14: '14:00 Uhr',
    15: '15:00 Uhr',
    16: '16:00 Uhr',
    17: '17:00 Uhr',
    18: '18:00 Uhr',
    19: '19:00 Uhr',
    20: '20:00 Uhr',
    21: '21:00 Uhr',
    22: '22:00 Uhr',
    23: '23:00 Uhr'
  };

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private mds: MainDataService,
    private bs: BackendService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      const appConfig = this.mds.appConfig.getAppConfig();
      this.configForm = this.fb.group({
        appTitle: this.fb.control(appConfig.get('app_title')),
        introHtml: this.fb.control(appConfig.get('intro_html')),
        impressumHtml: this.fb.control(appConfig.get('impressum_html')),
        globalWarningText: this.fb.control(appConfig.get('global_warning')),
        globalWarningExpiredDay: this.fb.control(appConfig.get('global_warning_expired_day')),
        globalWarningExpiredHour: this.fb.control(appConfig.get('global_warning_expired_hour'))
      });
      this.warningIsExpired = AppConfig.isWarningExpired(
        appConfig.get('global_warning_expired_day'),
        appConfig.get('global_warning_expired_hour')
      );
      this.configDataChangedSubscription = this.configForm.valueChanges.subscribe(() => {
        this.warningIsExpired = AppConfig.isWarningExpired(
          this.configForm.get('globalWarningExpiredDay').value,
          this.configForm.get('globalWarningExpiredHour').value
        );
        this.dataChanged = true;
      });
    });
  }

  saveData(): void {
    const appConfig = new Map<string, string>();
    appConfig.set('app_title', this.configForm.get('appTitle').value);
    // todo appConfig.set('mainLogo', this.mainLogo);
    // todo appConfig.set('background_body', this.background_body);
    // todo appConfig.set('background_box', this.background_box);
    appConfig.set('intro_html', this.configForm.get('introHtml').value);
    appConfig.set('impressum_html', this.configForm.get('impressumHtml').value);
    appConfig.set('global_warning', this.configForm.get('globalWarningText').value);
    appConfig.set('global_warning_expired_day', this.configForm.get('globalWarningExpiredDay').value);
    appConfig.set('global_warning_expired_hour', this.configForm.get('globalWarningExpiredHour').value);

    this.mds.appConfig.setAppConfig(appConfig);
    this.mds.appConfig.applyBackgroundColors();
    this.bs.setAppConfig(appConfig).subscribe(isOk => {
      if (isOk) {
        this.snackBar.open(
          'Konfigurationsdaten der Anwendung gespeichert', 'Info', { duration: 3000 }
        );
        this.dataChanged = false;
        this.mds.appConfig.setAppConfig(appConfig);
        this.mds.appConfig.applyBackgroundColors();
      } else {
        this.snackBar.open('Konnte Konfigurationsdaten der Anwendung nicht speichern', 'Fehler', { duration: 3000 });
      }
    },
    () => {
      this.snackBar.open('Konnte Konfigurationsdaten der Anwendung nicht speichern', 'Fehler', { duration: 3000 });
    });
  }

  ngOnDestroy(): void {
    if (this.configDataChangedSubscription !== null) this.configDataChangedSubscription.unsubscribe();
  }
}
