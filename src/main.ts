import {enableProdMode, StaticProvider} from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { name, version, repository } from '../package.json';

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
    useValue: name
  },
  {
    provide: 'APP_VERSION',
    useValue: version
  },
  {
    provide: 'API_VERSION_EXPECTED',
    useValue: environment.apiVersionExpected
  },
  {
    provide: 'REPOSITORY_URL',
    useValue: repository.url
  },
  {
    provide: 'IS_PRODUCTION_MODE',
    useValue: environment.production
  }
]).bootstrapModule(AppModule)
  .catch(err => console.log(err));
