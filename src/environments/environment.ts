// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // testcenterUrl: 'http://localhost/2020/testcenter-iqb-php-postgrestest/',
  // testcenterUrl: 'https://ocba.iqb.hu-berlin.de/api/',
  testcenterUrl: 'http://localhost/2020/testcenter-iqb-php/',
  // testcenterUrl: 'https://www.iqb-testcenter.de/',
  // testcenterUrl: 'http://localhost/api/',
  appPublisher: 'IQB - Institut zur Qualitätsentwicklung im Bildungswesen',
  apiVersionExpected: '4.0.0'
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
