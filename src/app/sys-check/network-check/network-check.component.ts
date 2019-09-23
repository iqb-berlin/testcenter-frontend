import { SyscheckDataService } from '../syscheck-data.service';
import { Component, OnInit } from '@angular/core';
import {
  BackendService,
  NetworkRequestTestResult,
  ReportEntry,
  RequestBenchmarkerFunction,
  RequestBenchmarkerFunctionCallback
} from '../backend.service';
import {of} from "rxjs";
import {any} from 'codelyzer/util/function';

@Component({
  selector: 'iqb-network-check',
  templateUrl: './network-check.component.html',
  styleUrls: ['./network-check.component.css']
})
export class NetworkCheckComponent implements OnInit {
  status = '';
  testDone = false;
  networkStats: NetworkData = {
    avgUploadSpeed: -1,
    avgDownloadSpeed: -1,
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

    this.networkStats = {
        avgUploadSpeed: -1,
        avgDownloadSpeed: -1,
        pingTest: -1
      };

    const updateStatus = (newStatus: string) => {
        this.status = newStatus;
    };

    const benchmark = (benchmarkType: 'down'|'up', requestSize: number) => {

      console.log(`run benchmark ${benchmarkType} for ${requestSize}`);
      if (benchmarkType) {
        updateStatus(`Downloadgeschwindigkeit wird getestet... (Testgröße: ${requestSize} bytes`);
        return this.bs.benchmarkDownloadRequest(requestSize);
      } else {
        updateStatus(`Uploadgeschwindigkeit wird getestet... (Testgröße: ${requestSize} bytes)`);
        return this.bs.benchmarkUploadRequest(requestSize);
      }
    };

    const calculateStatistics = (testResults: Array<NetworkRequestTestResult>): number =>
        testResults.reduce(
          (sum, result) => sum + (result.size / result.duration * 1000),
          0
        ) / testResults.length;


    const reportResults = () => {
      console.log('Test results:');
      console.log(this.networkStats);
      window['testResults'] = this.networkStats;

      this.networkRating = this.calculateNetworkRating(this.networkStats);

      updateStatus(`Die folgenden Netzwerkeigenschaften wurden festgestellt:`);
      this.testDone = true;

      // send data for reporting
      const reportEntry: ReportEntry[] = [];
      reportEntry.push({id: '0', type: 'network', label: 'Downloadgeschwindigkeit',
        value: this.networkStats.avgDownloadSpeed.toLocaleString()});
      reportEntry.push({id: '0', type: 'network', label: 'Downloadbewertung', value: this.networkRating.downloadRating});
      reportEntry.push({id: '0', type: 'network', label: 'Uploadgeschwindigkeit',
        value: this.networkStats.avgUploadSpeed.toLocaleString()});
      reportEntry.push({id: '0', type: 'network', label: 'Uploadbewertung', value: this.networkRating.uploadRating});
      reportEntry.push({id: '0', type: 'network', label: 'Ping', value: this.networkStats.pingTest.toLocaleString()});
      reportEntry.push({id: '0', type: 'network', label: 'Ping-Bewertung', value: this.networkRating.pingRating});
      reportEntry.push({id: '0', type: 'network', label: 'Allgemeine Bewertung der Verbindung', value: this.networkRating.overallRating});

      this.ds.networkData$.next(reportEntry);
     };


    const benchmarkSequence = (testSizes: Array<number>, type: 'down' | 'up') =>
      testSizes.reduce(
        (sequence, testSize) => sequence.then(results => benchmark(type, testSize)
          .then(result => {results.push(result); return results; })
        ),
        Promise.resolve(new Array<NetworkRequestTestResult>())
      );

    const downloadTestSizes = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304];
    const uploadTestSizes = [];

    benchmarkSequence(downloadTestSizes, 'down')
      .then(calculateStatistics)
      .then(avgDownSpeed => this.networkStats.avgDownloadSpeed = avgDownSpeed)
      .then(() => benchmarkSequence(uploadTestSizes, 'up'))
      .then(calculateStatistics)
      .then(avgUpSpeed => this.networkStats.avgUploadSpeed = avgUpSpeed)
      .then(reportResults);
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
    if (nd.avgDownloadSpeed < testConfig.downloadGood) {
        awardedNetworkRating.downloadRating = 'ok';
    }
    if (nd.avgDownloadSpeed < testConfig.downloadMinimum) {
        awardedNetworkRating.downloadRating = 'insufficient';
    }

    awardedNetworkRating.uploadRating = 'good';
    if (nd.avgUploadSpeed < testConfig.downloadGood) {
        awardedNetworkRating.uploadRating = 'ok';
    }
    if (nd.avgUploadSpeed < testConfig.downloadMinimum) {
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

export interface NetworkData {
  avgUploadSpeed: number;
  avgDownloadSpeed: number;
  pingTest: number;
}

export type TechCheckRating = 'N/A' | 'insufficient' | 'ok' | 'good';

export interface NetworkRating {
  uploadRating: TechCheckRating;
  downloadRating: TechCheckRating;
  pingRating: TechCheckRating;
  overallRating: TechCheckRating;
}

