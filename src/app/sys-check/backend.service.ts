import {
  CheckConfigAbstract,
  CheckConfig,
  NetworkRequestTestResult,
  UnitAndPlayerContainer,
  SysCheckReport
} from './sys-check.interfaces';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ErrorHandler, ServerError } from 'iqb-components';


@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient
  ) {}


  public getCheckConfigs(): Observable<CheckConfigAbstract[]> {

    return this.http
      .get<CheckConfigAbstract[]>(this.serverUrl + 'sys-checks')
      .pipe(
        catchError(() => {
          const myreturn: CheckConfigAbstract[] = [];
          return of(myreturn);
        })
      );
  }


  public getCheckConfigData(workspaceId: number, sysCheckName: string): Observable<CheckConfig> {

    return this.http
      .get<CheckConfig>(this.serverUrl + `workspace/${workspaceId}/sys-check/${sysCheckName}`)
      .pipe(
        catchError(() => {
          const myreturn: CheckConfig = null;
          return of(myreturn);
        })
      );
  }


  public saveReport(workspaceId: number, sysCheckName: string, sysCheckReport: SysCheckReport): Observable<Boolean|ServerError> {

    return this.http
      .put<boolean>(this.serverUrl + `workspace/${workspaceId}/sys-check/${sysCheckName}/report`, {...sysCheckReport})
  }


  public getUnitAndPlayer(workspaceId: number, sysCheckName: string): Observable<UnitAndPlayerContainer|ServerError> {

    const startingTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
    return this.http
      .get<UnitAndPlayerContainer>(this.serverUrl + `workspace/${workspaceId}/sys-check/${sysCheckName}/unit-and-player`)
      .pipe(map(data => {
          data.duration = BackendService.getMostPreciseTimestampBrowserCanProvide() - startingTime;
          return data;
        }),
        catchError(ErrorHandler.handle)
      );
  }


  public benchmarkDownloadRequest(requestedDownloadSize: number): Promise<NetworkRequestTestResult> {

    const serverUrl = this.serverUrl;
    const cacheKiller = '&uid=' + (new Date().getTime());
    const testResult: NetworkRequestTestResult = {
      type: 'downloadTest',
      size: requestedDownloadSize,
      duration: 5000,
      error: null,
      speedInBPS: 0
    };

    return new Promise(function(resolve) {

      const xhr = new XMLHttpRequest();
      xhr.open('GET', serverUrl + `speed-test/random-package/${requestedDownloadSize}${cacheKiller}`, true);

      xhr.timeout = 45000;

      xhr.onload = () => {
        if (xhr.status !== 200) {
          testResult.error = `Error ${xhr.statusText} (${xhr.status}) `;
        }
        // tslint:disable-next-line:triple-equals
        if (xhr.response.toString().length != requestedDownloadSize) {
          testResult.error = `Error: Data package has wrong size! ${requestedDownloadSize} ` + xhr.response.toString().length;
        }
        const currentTime = testResult.duration = BackendService.getMostPreciseTimestampBrowserCanProvide();
        // console.log({'c': currentTime, 's': startingTime});
        testResult.duration = currentTime - startingTime;
        resolve(testResult);
      };

      xhr.onerror = () => {
        testResult.error = `Network Error ${xhr.statusText} (${xhr.status}) `;
        resolve(testResult);
      };

      xhr.ontimeout = () => {
        testResult.duration = xhr.timeout;
        testResult.error = 'timeout';
        resolve(testResult);
      };

      const startingTime = BackendService.getMostPreciseTimestampBrowserCanProvide();

      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(`{"size":"${requestedDownloadSize}"}`);
    });
  }


  public benchmarkUploadRequest(requestedUploadSize: number): Promise<NetworkRequestTestResult> {

    const serverUrl = this.serverUrl;
    const randomContent = BackendService.generateRandomContent(requestedUploadSize);
    const testResult: NetworkRequestTestResult = {
      type: 'uploadTest',
      size: requestedUploadSize,
      duration: 10000,
      error: null,
      speedInBPS: 0
    };

    return new Promise(function(resolve) {

      const xhr = new XMLHttpRequest();
      xhr.open('POST', serverUrl + 'speed-test/random-package', true);

      xhr.timeout = 10000;

      xhr.setRequestHeader('Content-Type', 'text/plain');

      xhr.onload = () => {

        if (xhr.status !== 200) {
          testResult.error = `Error ${xhr.statusText} (${xhr.status}) `;
        }

        const currentTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
        testResult.duration = currentTime - startingTime;

        try {

          const response = JSON.parse(xhr.response);

          const arrivingSize = parseFloat(response['packageReceivedSize']);
          // tslint:disable-next-line:triple-equals
          if (arrivingSize != requestedUploadSize) {
            testResult.error = `Error: Data package has wrong size! ${requestedUploadSize} != ${arrivingSize}`;
          }
        } catch (e) {
          testResult.error = `bogus server response`;
        }

        // console.log({ 'c': currentTime, 's': startingTime });
        resolve(testResult);

      };

      xhr.onerror = () => {
        testResult.error = `Network Error ${xhr.statusText} (${xhr.status}) `;
        resolve(testResult);
      };

      xhr.ontimeout = () => {
        testResult.duration = xhr.timeout;
        testResult.error = 'timeout';
        resolve(testResult);
      };

      const startingTime = BackendService.getMostPreciseTimestampBrowserCanProvide();

      xhr.send(randomContent);
    });
  }


  // tslint:disable-next-line:member-ordering
  private static getMostPreciseTimestampBrowserCanProvide(): number {

    if (typeof performance !== 'undefined') {
      const timeOrigin = (typeof performance.timeOrigin !== 'undefined') ? performance.timeOrigin : performance.timing.navigationStart;
      if (typeof timeOrigin !== 'undefined' && timeOrigin) {
        return timeOrigin + performance.now();
      }
    }
    return Date.now(); // milliseconds
  }


  // tslint:disable-next-line:member-ordering
  private static generateRandomContent(length: number): string {

    const base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcefghijklmnopqrstuvwxyz0123456789+/';
    let randomString = '';
    for (let i = 1; i <= length; i++) {
      const randomCharacterID = Math.floor(Math.random() * 63);
      randomString += base64Characters[randomCharacterID];
    }
    return randomString;
  }
}

