import { SyscheckDataService } from '../syscheck-data.service';
import {Component, OnInit, ViewChild} from '@angular/core';
import {
  BackendService,
  NetworkRequestTestResult,
  ReportEntry
} from '../backend.service';
import { TcSpeedChartComponent } from './tc-speed-chart.component';

enum BenchmarkType {
  up,
  down
}

interface NetworkCheckStatus {
  message: string;
  avgUploadSpeed: number;
  avgDownloadSpeed: number;
  pingTest: number;
}

@Component({
  selector: 'iqb-network-check',
  templateUrl: './network-check.component.html',
  styleUrls: ['./network-check.component.css']
})
export class NetworkCheckComponent implements OnInit {

  @ViewChild(TcSpeedChartComponent) plotter;

  private status: NetworkCheckStatus = {
    message: 'Netzwerk-Analyse wird gestartet',
    avgUploadSpeed: -1,
    avgDownloadSpeed: -1,
    pingTest: -1
  };
  private testDone = false;

  private networkStats = new Map<BenchmarkType, number[]>([
    [BenchmarkType.down, []],
    [BenchmarkType.up, []],
  ]);

  private networkRating: NetworkRating = {
    downloadRating: 'N/A',
    uploadRating: 'N/A',
    pingRating: 'N/A',
    overallRating: 'N/A'
  };

  private testSizes = new Map<BenchmarkType, number[]>([
      [BenchmarkType.down, [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304]],
      [BenchmarkType.up, []],
  ]);


  constructor(
    private ds: SyscheckDataService,
    private bs: BackendService
  ) {
  }

  ngOnInit() {
  }

  public startCheck() {

    this.testDone = false;

    this.plotPrepare();

    this.loopBenchmarkSequence(BenchmarkType.down)
      .then(() => this.reportResults());
  }

  private plotPrepare() {

    this.plotter.reset({
      css: 'border: 0px solid black; width: 100%; max-width: 800px',
      width: 800,
      height: 180,
      labelPadding: 4,
      xAxisMaxValue: 16 + Math.max(...this.testSizes.get(BenchmarkType.down)),
      xAxisMinValue: Math.min(...this.testSizes.get(BenchmarkType.down)),
      yAxisMaxValue: 1000,
      yAxisMinValue: 10,
      xAxisStepSize: 4,
      yAxisStepSize: 100,
      lineWidth: 2,
      xProject: x => (x === 0 ) ? 0 : Math.sign(x) * Math.log2(Math.abs(x)),
      yProject: y => (y === 0 ) ? 0 : Math.sign(y) * Math.sqrt(Math.abs(y)),
      xAxisLabels: (x) => (this.testSizes.get(BenchmarkType.down).indexOf(x) > -1) ? this.humanReadableBytes(x) : '',
      yAxisLabels: (y, i) => (i < 10) ? this.humanReadableMilliseconds(y) : '',
    });
  }


  private loopBenchmarkSequence(type: BenchmarkType): PromiseLike<void> {

    console.log(`Benchmark Loop ${type} nr.:`  + this.networkStats.get(type).length);
    return new Promise((resolve, reject) => {
      const allowedDevianceBytesPerSecond = 50000;

      this.benchmarkSequence(type)
        .then(results => {
          const averageBytesPerSecond = this.calculateAverageSpeed(results);
          const averageOfPreviousLoops = this.getAverageNetworkStat(type);
          this.showBenchmarkSequenceResults(type, averageBytesPerSecond, results);
          this.networkStats.get(type).push(averageBytesPerSecond);

          if (this.networkStats.get(type).length < 11) {
            if (
              (this.networkStats.get(type).length < 3) ||
              (Math.abs(averageOfPreviousLoops - averageBytesPerSecond) > allowedDevianceBytesPerSecond)
            ) {
              return this.loopBenchmarkSequence(type).then(resolve);
            }
          }

          this.showBenchmarkSequenceResults(type, this.getAverageNetworkStat(type), results);
          resolve();
        });
    });
  }

  private getAverageNetworkStat(type: BenchmarkType): number {

    return this.networkStats.get(type).reduce((a, x) => a + x, 0) / this.networkStats.get(type).length;
  }


  private benchmarkSequence(type: BenchmarkType) {

    return this.testSizes.get(type).reduce(
      (sequence, testSize) => sequence.then(results => this.benchmark(type, testSize)
        .then(result => {
          results.push(result);
          return results;
        })
      ),
      Promise.resolve(new Array<NetworkRequestTestResult>())
    );
  }


  private benchmark(benchmarkType: BenchmarkType, requestSize: number) {

    console.log(`run benchmark ${benchmarkType} for ${requestSize}`);
    if (benchmarkType === BenchmarkType.down) {
      this.updateStatus(`Downloadgeschwindigkeit wird getestet... (Testgröße: ${requestSize} bytes)`);
      return this.bs.benchmarkDownloadRequest(requestSize);
    } else {
      this.updateStatus(`Uploadgeschwindigkeit wird getestet... (Testgröße: ${requestSize} bytes)`);
      return this.bs.benchmarkUploadRequest(requestSize);
    }
  }


  private showBenchmarkSequenceResults(benchmarkType: BenchmarkType, avgBytesPerSecond: number, results: Array<NetworkRequestTestResult>) {

    if (benchmarkType === BenchmarkType.down) {
      this.status.avgDownloadSpeed = avgBytesPerSecond;
    }
    if (benchmarkType === BenchmarkType.up) {
      this.status.avgUploadSpeed = avgBytesPerSecond;
    }

    this.plotStatistics(benchmarkType, results);
  }


  private calculateAverageSpeed = (testResults: Array<NetworkRequestTestResult>): number =>
    testResults.reduce((sum, result) => sum + (result.size / result.duration * 1000), 0) / testResults.length


  private plotStatistics(testType: BenchmarkType, benchmarkSequenceResults: Array<NetworkRequestTestResult>) {

    const datapoints = benchmarkSequenceResults.map(measurement => {
        // TODO handle timeouts
        return [measurement.size, measurement.duration];
    });
    this.plotter.plotData(datapoints);
    return benchmarkSequenceResults;
  }

  private reportResults() {

    console.log('Test results:');
    console.log(this.networkStats);

    this.calculateNetworkRating();

    this.updateStatus(`Die folgenden Netzwerkeigenschaften wurden festgestellt:`);
    this.testDone = true;

    // send data for reporting
    const reportEntry: ReportEntry[] = [];
    reportEntry.push({id: '0', type: 'network', label: 'Downloadgeschwindigkeit',
      value: this.getAverageNetworkStat(BenchmarkType.down).toLocaleString()});
    reportEntry.push({id: '0', type: 'network', label: 'Downloadbewertung', value: this.networkRating.downloadRating});
    reportEntry.push({id: '0', type: 'network', label: 'Uploadgeschwindigkeit',
      value: this.getAverageNetworkStat(BenchmarkType.up).toLocaleString()});
    reportEntry.push({id: '0', type: 'network', label: 'Uploadbewertung', value: this.networkRating.uploadRating});
    // reportEntry.push({id: '0', type: 'network', label: 'Ping', value: this.networkStats.pingTest.toLocaleString()});
    // reportEntry.push({id: '0', type: 'network', label: 'Ping-Bewertung', value: this.networkRating.pingRating});
    reportEntry.push({id: '0', type: 'network', label: 'Allgemeine Bewertung der Verbindung', value: this.networkRating.overallRating});

    this.ds.networkData$.next(reportEntry);
  }


  private updateStatus(newStatus: string) {

    this.status.message = newStatus;
  }


  public calculateNetworkRating(): void {

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

    const nd = {
      avgDownloadSpeed: this.getAverageNetworkStat(BenchmarkType.down),
      avgUploadSpeed: this.getAverageNetworkStat(BenchmarkType.up),
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

    // awardedNetworkRating.pingRating = 'good';
    // if (nd.pingTest > testConfig.downloadGood) {
    //     awardedNetworkRating.pingRating = 'ok';
    // }
    // if (nd.pingTest > testConfig.downloadMinimum) {
    //     awardedNetworkRating.pingRating = 'insufficient';
    // }

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

    this.networkRating = awardedNetworkRating;
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
  }

  private humanReadableMilliseconds = (milliseconds: number): string => (milliseconds / 1000).toString() + ' sec';

}



export type TechCheckRating = 'N/A' | 'insufficient' | 'ok' | 'good';

export interface NetworkRating {
  uploadRating: TechCheckRating;
  downloadRating: TechCheckRating;
  pingRating: TechCheckRating;
  overallRating: TechCheckRating;
}

