import {CheckConfig, CheckConfigData, NetworkRequestTestResult, ReportEntry, UnitData} from './sys-check.interfaces';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ErrorHandler, ServerError } from 'iqb-components';


@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private serverSlimUrl_GET: string;

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient) {

    this.serverUrl = this.serverUrl + 'php_tc/';
    this.serverSlimUrl_GET = this.serverUrl + 'tc_get.php/';
  }

  getCheckConfigs(): Observable<CheckConfig[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http
      .post<CheckConfig[]>(this.serverUrl + 'getSysCheckConfigs.php', {}, httpOptions)
      .pipe(
        catchError(() => {
          const myreturn: CheckConfig[] = [];
          return of(myreturn);
        })
      );
  }

  getCheckConfigData(cid: string): Observable<CheckConfigData> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http
      .post<CheckConfigData>(this.serverUrl + 'getSysCheckConfigData.php', {c: cid}, httpOptions)
        .pipe(
          catchError(() => {
          const myreturn: CheckConfigData = null;
          return of(myreturn);
        })
      );
  }


  public saveReport (cid: string, keyphrase: string, title: string, envResults: ReportEntry[], networkResults: ReportEntry[],
                     questionnaireResults: ReportEntry[], unitResults: ReportEntry[]): Observable<Boolean> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this.serverUrl + 'saveSysCheckReport.php',
          {c: cid, k: keyphrase, t: title, e: envResults, n: networkResults, q: questionnaireResults, u: unitResults}, httpOptions)
        .pipe(
          catchError(() => {
            return of(false);
          })
        );
  }


  public getUnitAndPlayer(configId: string): Observable<UnitData|ServerError> {

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    const startingTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
    return this.http
      .post<UnitData>(this.serverUrl + 'getSysCheckUnitData.php', {c: configId}, httpOptions)
      .pipe(tap(val => console.log('############## UNIT DATA', val)))
      .pipe(map(data => {
          data.duration = BackendService.getMostPreciseTimestampBrowserCanProvide() - startingTime;
          return data;
        }),
        catchError(ErrorHandler.handle)
      );
  }


  benchmarkDownloadRequest(requestedDownloadSize: number): Promise<NetworkRequestTestResult> {

    const serverUrl = this.serverUrl;
    const testResult: NetworkRequestTestResult = {
      type: 'downloadTest',
      size: requestedDownloadSize,
      duration: 5000,
      error: null,
      speedInBPS: 0
    };

    return new Promise(function(resolve, reject) {

      const xhr = new XMLHttpRequest();
      xhr.open('POST', serverUrl + 'doSysCheckDownloadTest.php?size=' +
        requestedDownloadSize + '&uid=' + (new Date().getTime()), true);

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
        console.log({'c': currentTime, 's': startingTime});
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

  benchmarkUploadRequest(requestedUploadSize: number): Promise<NetworkRequestTestResult> {

    const serverUrl = this.serverUrl;
    const randomContent = BackendService.generateRandomContent(requestedUploadSize);
    const testResult: NetworkRequestTestResult = {
      type: 'uploadTest',
      size: requestedUploadSize,
      duration: 10000,
      error: null,
      speedInBPS: 0
    };

    return new Promise(function (resolve, reject) {
      if (reject) {
        console.log('reject is set');
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', serverUrl + 'doSysCheckUploadTest.php', true);

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

        console.log({ 'c': currentTime, 's': startingTime });
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

