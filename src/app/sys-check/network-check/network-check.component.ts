import { SyscheckDataService } from '../syscheck-data.service';
import { Component, OnInit } from '@angular/core';
import {
  BackendService,
  NetworkRequestTestResult,
  ReportEntry,
  RequestBenchmarkerFunction,
  RequestBenchmarkerFunctionCallback
} from '../backend.service';

@Component({
  selector: 'iqb-network-check',
  templateUrl: './network-check.component.html',
  styleUrls: ['./network-check.component.css']
})
export class NetworkCheckComponent implements OnInit {
  status = '';
  testDone = false;
  averageSpeed: AverageSpeed = {
    uploadTest: -1,
    downloadTest: -1,
    pingTest: -1
  };
  networkRating: NetworkRating = {
    downloadRating: 'N/A',
    uploadRating: 'N/A',
    pingRating: 'N/A',
    overallRating: 'N/A'
  };

  constructor(
    private ds: SyscheckDataService,
    private bs: BackendService
  ) { }

  ngOnInit() {

  }

  public startCheck() {

    this.testDone = false;

    this.averageSpeed = {
        uploadTest: -1,
        downloadTest: -1,
        pingTest: -1
      };

    const updateStatus = (newStatus: string) => {
        this.status = newStatus;
    };

    const benchmark = (isDownload: boolean, requestSize: number, testResults: Array<NetworkRequestTestResult>) => {

      if (isDownload) {
        updateStatus(`Downloadgeschwindigkeit wird getestet... (Testgröße: ${requestSize} bytes; Test: /3)`);
        return this.bs.benchmarkDownloadRequest(requestSize);
      } else {
        updateStatus(`Uploadgeschwindigkeit wird getestet... (Testgröße: ${requestSize} bytes; Test: }/3)`);
        return this.bs.benchmarkUploadRequest(requestSize);
      }
    };

    // const testResults: Array<NetworkRequestTestResult> = [];

    benchmark(true, 1, [])
      .then(results => benchmark(true, 2, results))
      .then(results => benchmark(false, 1, results))
      .then(results => benchmark(false, 2, results))
      .then((testResults) => {
        console.log('Test results:');
        console.log(testResults);
        console.log(this.averageSpeed);
        window['testResults'] = testResults;

        this.networkRating = this.calculateNetworkRating(this.averageSpeed);

        updateStatus(`Die folgenden Netzwerkeigenschaften wurden festgestellt:`);
        this.testDone = true;

        // send data for reporting
        const myReport: ReportEntry[] = [];

        myReport.push({'id': '0', 'type': 'network',
          'label': 'Downloadgeschwindigkeit', 'value': this.averageSpeed.downloadTest.toLocaleString()});
        myReport.push({'id': '0', 'type': 'network',
          'label': 'Downloadbewertung', 'value': this.networkRating.downloadRating});

        myReport.push({'id': '0', 'type': 'network',
          'label': 'Uploadgeschwindigkeit', 'value': this.averageSpeed.uploadTest.toLocaleString()});
        myReport.push({'id': '0', 'type': 'network',
          'label': 'Uploadbewertung', 'value': this.networkRating.uploadRating});

        myReport.push({'id': '0', 'type': 'network',
          'label': 'Ping', 'value': this.averageSpeed.pingTest.toLocaleString()});
        myReport.push({'id': '0', 'type': 'network',
          'label': 'Ping-Bewertung', 'value': this.networkRating.pingRating});

        myReport.push({'id': '0', 'type': 'network',
          'label': 'Allgemeine Bewertung der Verbindung zum Server', 'value': this.networkRating.overallRating});

        this.ds.networkData$.next(myReport);
      });

  }

  public calculateNetworkRating(nd: NetworkData): NetworkRating {

    // assumes that this.ds.checkConfig$ is already set;

    const testConfig = this.ds.checkConfig$.getValue();
    console.log('Test configuration used to calculate network compatibility with the Test Center:');
    console.log(testConfig);

    const awardedNetworkRating: NetworkRating = {
        downloadRating: 'N/A',
        uploadRating: 'N/A',
        pingRating: 'N/A',
        overallRating: 'N/A'
    };

    // the ratings are calculated individually, by a "how low can you go" approach

    awardedNetworkRating.downloadRating = 'good';
    if (nd.downloadTest < testConfig.downloadGood) {
        awardedNetworkRating.downloadRating = 'ok';
    }
    if (nd.downloadTest < testConfig.downloadMinimum) {
        awardedNetworkRating.downloadRating = 'insufficient';
    }

    awardedNetworkRating.uploadRating = 'good';
    if (nd.uploadTest < testConfig.downloadGood) {
        awardedNetworkRating.uploadRating = 'ok';
    }
    if (nd.uploadTest < testConfig.downloadMinimum) {
        awardedNetworkRating.uploadRating = 'insufficient';
    }

    awardedNetworkRating.pingRating = 'good';
    if (nd.pingTest > testConfig.downloadGood) {
        awardedNetworkRating.pingRating = 'ok';
    }
    if (nd.pingTest > testConfig.downloadMinimum) {
        awardedNetworkRating.pingRating = 'insufficient';
    }

    awardedNetworkRating.overallRating = 'good';
    if (awardedNetworkRating.downloadRating === 'ok' ||
        awardedNetworkRating.uploadRating === 'ok' ||
        awardedNetworkRating.pingRating === 'ok') {

        // if at least one rating is lower than good, then the overall network rating is also lower than good
        awardedNetworkRating.overallRating = 'ok';
    }

    if (awardedNetworkRating.downloadRating === 'insufficient' ||
        awardedNetworkRating.uploadRating === 'insufficient' ||
        awardedNetworkRating.pingRating === 'insufficient') {

        // if at least one rating is lower than good, then the overall rating is also lower than good
        awardedNetworkRating.overallRating = 'insufficient';
    }

    return awardedNetworkRating;
  }


  public humanReadableBytes(bytes: number): string {

    const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    if (isNaN(parseFloat('' + bytes)) || !isFinite(bytes)) {
      return '-';
    }
    if (bytes <= 0 ) {
      return '0';
    }

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(i))).toFixed(1) +  ' ' + units[i];
  }

}

export interface AverageSpeed {
  uploadTest: number;
  downloadTest: number;
  pingTest: number;
}


export interface NetworkData {
    uploadTest: number;
    downloadTest: number;
    pingTest: number;
  }

  export type TechCheckRating = 'N/A' | 'insufficient' | 'ok' | 'good';

  export interface NetworkRating {
    uploadRating: TechCheckRating;
    downloadRating: TechCheckRating;
    pingRating: TechCheckRating;
    overallRating: TechCheckRating;
 }

