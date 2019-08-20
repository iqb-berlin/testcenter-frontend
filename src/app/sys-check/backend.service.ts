import { CheckConfig } from './backend.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TaggedString } from '../test-controller/test-controller.interfaces';
import { ServerError } from '../test-controller/test-controller.classes';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  public basicTestConfig: CheckConfig =
    {
      id: 'Basistest',
      label: 'Basistest',
      description: 'Es wird nur ein Bericht zu grundlegenden Systemeigenschaften und zur Netzverbindung gegeben.'
    };
  public basicTestConfigData: CheckConfigData =
    {
      id: 'Basistest',
      label: 'Basistest',
      questions: [],
      hasunit: false,
      cansave: false,
      questionsonlymode: false,
      ratings: [],
      skipnetwork: false,
      downloadMinimum: 1024 * 1024,
      downloadGood: 1024 * 1024 * 10,
      uploadMinimum: 1024 * 512,
      uploadGood: 1024 * 1024 * 5,
      pingMinimum: 5000,
      pingGood: 1000
    };
  private serverSlimUrl_GET: string;

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) {
      this.serverUrl = this.serverUrl + 'php_tc/';
      this.serverSlimUrl_GET = this.serverUrl + 'tc_get.php/';
  }

  // uppercase and add extension if not part
  // TODO there is a copy of this in testController/backendService -> move to common ancestor
  static normaliseId(s: string, standardext = ''): string {
    s = s.trim().toUpperCase();
    s.replace(/\s/g, '_');
    if (standardext.length > 0) {
      standardext = standardext.trim().toUpperCase();
      standardext.replace(/\s/g, '_');
      standardext = '.' + standardext.replace('.', '');

      if (s.slice(-(standardext.length)) !== standardext) {
        s = s + standardext;
      }
    }
    return s;
  }

  // TODO there is a copy of this in testController/backendService -> move to common ancestor
  static handle(errorObj: HttpErrorResponse): Observable<ServerError> {
    let myreturn: ServerError = null;
    if (errorObj.error instanceof ErrorEvent) {
      myreturn = new ServerError(500, 'Verbindungsproblem', (<ErrorEvent>errorObj.error).message);
    } else {
      myreturn = new ServerError(errorObj.status, 'Verbindungsproblem', errorObj.message);
      if (errorObj.status === 401) {
        myreturn.labelNice = 'Zugriff verweigert - bitte (neu) anmelden!';
      } else if (errorObj.status === 504) {
        myreturn.labelNice = 'Achtung: Server meldet Datenbankproblem.';
      }
    }
    return of(myreturn);
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  getCheckConfigs(): Observable<CheckConfig[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<CheckConfig[]>(this.serverUrl + 'getSysCheckConfigs.php', {}, httpOptions)
        .pipe(
          catchError(problem_data => {
          const myreturn: CheckConfig[] = [];
          return of(myreturn);
        })
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  getCheckConfigData(cid: string): Observable<CheckConfigData> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<CheckConfigData>(this.serverUrl + 'getSysCheckConfigData.php', {c: cid}, httpOptions)
        .pipe(
          catchError(problem_data => {
          const myreturn: CheckConfigData = null;
          return of(myreturn);
        })
      );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  public saveReport (cid: string, keyphrase: string, title: string,
      envResults: ReportEntry[], networkResults: ReportEntry[], questionnaireResults: ReportEntry[]): Observable<Boolean> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this.serverUrl + 'saveSysCheckReport.php',
          {c: cid, k: keyphrase, t: title, e: envResults, n: networkResults, q: questionnaireResults}, httpOptions)
        .pipe(
          catchError(problem_data => {
            return of(false);
          })
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  public getUnitData (configId: string): Observable<UnitData> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<UnitData>(this.serverUrl + 'getSysCheckUnitData.php', {c: configId}, httpOptions)
        .pipe(
          catchError(problem_data => {
            const myreturn: UnitData = null;
            return of(myreturn);
          })
        );
  }


  // TODO there is a copy of this in testController -> move to common service
  getResource(internalKey: string, resId: string, versionning = false): Observable<TaggedString | ServerError> {
    const myHttpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      }),
      responseType: 'text' as 'json'
    };
    const urlSuffix = versionning ? '?v=1' : '';
    return this.http.get<string>(this.serverSlimUrl_GET + 'resource/' + resId + urlSuffix, myHttpOptions)
      .pipe(
        map(def => <TaggedString>{tag: internalKey, value: def}),
        catchError(BackendService.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // Network check functions
  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // 7777777777777777777777777777777777777777777777777777777777777777777777
  benchmarkDownloadRequest (requestedDownloadSize: number,
                            timeout: number,
                            callback: RequestBenchmarkerFunctionCallback): void {
    // uses https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout

    const xhr = new XMLHttpRequest();
    xhr.open('GET',  this.serverUrl + 'doSysCheckDownloadTest.php?size=' +
                     requestedDownloadSize + '&uid=' + (new Date().getTime()), true);

    xhr.timeout = timeout;

    let startingTime;

    xhr.onload = function () {
        // Request finished. Do processing here.
        const currentTime = new Date().getTime();

        const testResult: NetworkRequestTestResult = {
            'type': 'downloadTest',
            'size': requestedDownloadSize,
            'duration': currentTime - startingTime
        };

        callback(testResult);
    };

    xhr.ontimeout = function (e) {
        // XMLHttpRequest timed out. Do something here.
        const testResult: NetworkRequestTestResult = {
            'type': 'downloadTest',
            'size': requestedDownloadSize,
            'duration': -1 * xhr.timeout
        };

        callback(testResult);
    };

    startingTime = new Date().getTime();

    xhr.send(null);
  }

  benchmarkUploadRequest (requestedUploadSize: number,
                          timeout: number,
                          callback: RequestBenchmarkerFunctionCallback) {
    // uses https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout
    // and https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send

    const base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcefghijklmnopqrstuvwxyz0123456789+/';

    let startingTime;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', this.serverUrl + 'doSysCheckUploadTest.php', true);

    xhr.timeout = timeout;

    // Send the proper header information along with the request
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function() { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            // Request finished. Do processing here.
            const currentTime = new Date().getTime();

            const testResult: NetworkRequestTestResult = {
                'type': 'uploadTest',
                'size': requestedUploadSize,
                'duration': currentTime - startingTime
            };

            callback(testResult);
        }
    };

    xhr.ontimeout = function (e) {
        // XMLHttpRequest timed out. Do something here.
        const testResult: NetworkRequestTestResult = {
            'type': 'uploadTest',
            'size': requestedUploadSize,
            'duration': -1 * xhr.timeout
        };
        callback(testResult);
    };

    let uploadedContent = '';
    for (let i = 1; i <= requestedUploadSize; i++)  {
      let randomCharacterID = Math.floor(Math.random() * 63);
      if (randomCharacterID > base64Characters.length - 1) {
        // failsafe, in case the random number generator is a bit imprecisely programmed and gives too big of a number back
        randomCharacterID = base64Characters.length - 1;
      }
      uploadedContent += base64Characters[randomCharacterID];
    }
    startingTime = new Date().getTime();
    xhr.send('package=' + uploadedContent);
  }


// end of network check functions
// 7777777777777777777777777777777777777777777777777777777777777777777777

} // end of backend service

export interface CheckConfig {
  id: string;
  label: string;
  description: string;
}

export interface Rating {
  type: string;
  min: number;
  good: number;
  value: string;
}

export interface CheckConfigData {
  id: string;
  label: string;
  questions: FormDefEntry[];
  hasunit: boolean;
  cansave: boolean;
  questionsonlymode: boolean;
  ratings: Rating[];
  skipnetwork: boolean;
  uploadMinimum: number;
  uploadGood: number;
  downloadMinimum: number;
  downloadGood: number;
  pingMinimum: number;
  pingGood: number;
}

export interface FormDefEntry {
  id: string;
  type: string;
  prompt: string;
  value: string;
  options: string[];
}

export type RequestBenchmarkerFunction = (requestSize: number, timeout: number, callback: RequestBenchmarkerFunctionCallback) => void;
export type RequestBenchmarkerFunctionCallback = (testResult: NetworkRequestTestResult) => void;

export interface UnitData {
  key: string;
  label: string;
  def: string;
  player: string;
}

export interface NetworkRequestTestResult {
  'type': 'downloadTest' | 'uploadTest';
  'size': number;
  'duration': number;
}

export interface ReportEntry {
  id: string;
  type: string;
  label: string;
  value: string;
}
