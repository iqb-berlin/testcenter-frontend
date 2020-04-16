import {enableProdMode, StaticProvider} from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic(<StaticProvider[]>[
  {
    provide: 'SERVER_URL',
    useValue: environment.testcenterUrl
  },
  {
    provide: 'APP_PUBLISHER',
    useValue: environment.appPublisher
  },
  {
    provide: 'APP_NAME',
    useValue: environment.appName
  },
  {
    provide: 'APP_VERSION',
    useValue: environment.appVersion
  },
  {
    provide: 'API_VERSION_EXPECTED',
    useValue: environment.apiVersionExpected
  }
]).bootstrapModule(AppModule)
  .catch(err => console.log(err));
