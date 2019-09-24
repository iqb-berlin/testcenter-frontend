import { SyscheckDataService } from '../syscheck-data.service';
import {Component, OnInit, ViewChild} from '@angular/core';
import {
  BackendService,
  NetworkRequestTestResult,
  ReportEntry
} from '../backend.service';
import {TcSpeedChartComponent} from './tc-speed-chart.component';

@Component({
  selector: 'iqb-network-check',
  templateUrl: './network-check.component.html',
  styleUrls: ['./network-check.component.css']
})
export class NetworkCheckComponent implements OnInit {

  @ViewChild(TcSpeedChartComponent) plotter;

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

    const downloadTestSizes = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304];
    // const uploadTestSizes = [];

    this.plotPrepare();

    this.benchmarkSequence(downloadTestSizes, TestType.down)
      .then(results => this.handleTestSequenceResults(TestType.down, results))
      // .then(() => this.benchmarkSequence(uploadTestSizes, TestType.up))
      // .then(results => this.handleTestSequenceResults(TestType.up, results))
      .then(() => this.reportResults());
  }

  private plotPrepare() {

    this.plotter.reset({
      css: 'border: 0px solid black',
      width: 800,
      height: 240,
      gridColor: 'silver',
      axisColor: 'red',
      labelFont: '20 pt Verdana',
      labelPadding: 4,
      xAxisMaxValue: 5000000,
      xAxisMinValue: 0,
      yAxisMaxValue: 800,
      yAxisMinValue: 0,
      xAxisStepSize: 524288,
      yAxisStepSize: 100,
      lineWidth: 5,
      xProject: x => (x === 0 ) ? 0 : Math.sign(x) * Math.sqrt(Math.abs(x)),
      yProject: y => (y === 0 ) ? 0 : Math.sign(y) * Math.sqrt(Math.abs(y)),
      xAxisLabels: (x) => this.humanReadableBytes(x),
      yAxisLabels: (y) => this.humanReadableMilliseconds(y),
    });
  }

  private benchmark(benchmarkType: TestType, requestSize: number) {

    console.log(`run benchmark ${benchmarkType} for ${requestSize}`);
    if (benchmarkType === TestType.down) {
      this.updateStatus(`Downloadgeschwindigkeit wird getestet... (Testgröße: ${requestSize} bytes`);
      return this.bs.benchmarkDownloadRequest(requestSize);
    } else {
      this.updateStatus(`Uploadgeschwindigkeit wird getestet... (Testgröße: ${requestSize} bytes)`);
      return this.bs.benchmarkUploadRequest(requestSize);
    }
  }

  private benchmarkSequence(testSizes: Array<number>, type: TestType) {

    return testSizes.reduce(
      (sequence, testSize) => sequence.then(results => this.benchmark(type, testSize)
        .then(result => {
          results.push(result);
          return results;
        })
      ),
      Promise.resolve(new Array<NetworkRequestTestResult>())
    );
  }

  private handleTestSequenceResults(testType: TestType, testSequenceResults: Array<NetworkRequestTestResult>) {

    const field = (testType === TestType.down) ? 'avgDownloadSpeed' : 'avgUploadSpeed';
    this.networkStats[field] = this.calculateStatistics(testSequenceResults);
    this.plotStatistics(testType, testSequenceResults);
  }

  private calculateStatistics = (testResults: Array<NetworkRequestTestResult>): number =>
    testResults.reduce((sum, result) => sum + (result.size / result.duration * 1000), 0) / testResults.length;

  private plotStatistics(testType: TestType, testSequenceResults: Array<NetworkRequestTestResult>) {

    window['testResults'] = testSequenceResults;
    const datapoints = testSequenceResults.map(measurement => {
        // TODO handle timeouts
        return [measurement.size, measurement.duration];
    });
    console.log(datapoints);

    this.plotter.plotData(datapoints);
    return testSequenceResults;
  }

  private reportResults() {
    console.log('Test results:');
    console.log(this.networkStats);

    this.networkRating = this.calculateNetworkRating(this.networkStats);

    this.updateStatus(`Die folgenden Netzwerkeigenschaften wurden festgestellt:`);
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
  }

  private updateStatus(newStatus: string) {

    this.status = newStatus;
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

  private humanReadableBytes = (bytes: number): string => {

    const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    if (isNaN(parseFloat('' + bytes)) || !isFinite(bytes)) {
      return '-';
    }
    if (bytes <= 0 ) {
      return '0';
    }

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(i))).toFixed(1) +  ' ' + units[i];
  };

  private humanReadableMilliseconds = (milliseconds: number): string => (milliseconds / 1000).toString() + ' sec';

}

enum TestType {
  up,
  down
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

