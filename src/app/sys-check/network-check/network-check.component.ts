import { SyscheckDataService } from '../syscheck-data.service';
import {Component, OnInit, ViewChild} from '@angular/core';
import {
  BackendService,
  NetworkRequestTestResult,
  ReportEntry
} from '../backend.service';

enum BenchmarkType {
  up,
  down
}

interface NetworkCheckStatus {
  message: string;
  avgUploadSpeedBytesPerSecond: number;
  avgDownloadSpeedBytesPerSecond: number;
}

interface BenchmarkDefinition {
  testSizes: number[];
  allowedDevianceBytesPerSecond: number;
  allowedErrorsPerSequence: number;
  allowedSequenceRepetitions: number;
}

type TechCheckRating = 'N/A' | 'insufficient' | 'ok' | 'good' | 'unstable';

interface NetworkRating {
  uploadRating: TechCheckRating;
  downloadRating: TechCheckRating;
  overallRating: TechCheckRating;
}

interface DetectedNetworkInformations {
  available: boolean;
  downlinkMegabitPerSecond: number;
  effectiveNetworkType: string;
  roundTripTimeMs: number;
  networkType: string;
}

@Component({
  selector: 'iqb-network-check',
  templateUrl: './network-check.component.html',
  styleUrls: ['./network-check.component.css']
})
export class NetworkCheckComponent implements OnInit {

  @ViewChild('downloadChart') downloadPlotter;
  @ViewChild('uploadChart') uploadPlotter;

  readonly benchmarkDefinitions = new Map<BenchmarkType, BenchmarkDefinition>([
    [BenchmarkType.down, {
      testSizes: [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304],
      allowedDevianceBytesPerSecond: 100000,
      allowedErrorsPerSequence: 0,
      allowedSequenceRepetitions: 15
    }],
    [BenchmarkType.up, {
      testSizes: [1024, 4096, 16384, 65536, 262144, 1048576, 4194304],
      allowedDevianceBytesPerSecond: 10000000,
      allowedErrorsPerSequence: 0,
      allowedSequenceRepetitions: 15
    }]
  ]);

  public status: NetworkCheckStatus = {
    message: 'Netzwerk-Analyse wird gestartet',
    avgUploadSpeedBytesPerSecond: -1,
    avgDownloadSpeedBytesPerSecond: -1
  };
  public testDone = false;

  private networkStats = new Map<BenchmarkType, number[]>([
    [BenchmarkType.down, []],
    [BenchmarkType.up, []],
  ]);

  private networkRating: NetworkRating = {
    downloadRating: 'N/A',
    uploadRating: 'N/A',
    overallRating: 'N/A'
  };

  public detectedNetworkInformations: DetectedNetworkInformations = {
    downlinkMegabitPerSecond: null,
    effectiveNetworkType: null,
    roundTripTimeMs: null,
    networkType: null,
    available: false
  };

  constructor(
    private ds: SyscheckDataService,
    private bs: BackendService
  ) {}

  ngOnInit() {}

  public startCheck() {

    this.testDone = false;

    this.status = {
      message: 'Netzwerk-Analyse wird neu gestartet',
      avgUploadSpeedBytesPerSecond: -1,
      avgDownloadSpeedBytesPerSecond: -1
    };

    this.networkStats = new Map<BenchmarkType, number[]>([
      [BenchmarkType.down, []],
      [BenchmarkType.up, []],
    ]);

    this.plotPrepare(BenchmarkType.down);
    this.plotPrepare(BenchmarkType.up);

    this.getBrowsersNativeNetworkInformations();

    this.loopBenchmarkSequence(BenchmarkType.down)
      .then(() => this.loopBenchmarkSequence(BenchmarkType.up))
      .then(() => this.reportResults())
      .catch(() => this.reportResults(true));
  }

  private plotPrepare(benchmarkType: BenchmarkType) {

    const testSizes = this.benchmarkDefinitions.get(benchmarkType).testSizes;
    const plotterSettings = {
      css: 'border: 0px solid black; width: 100%; max-width: 800px',
      width: 800,
      height: 140,
      labelPadding: 4,
      xAxisMaxValue: 16 + Math.max(...testSizes),
      xAxisMinValue: Math.min(...testSizes),
      yAxisMaxValue: (BenchmarkType.down === benchmarkType) ? 1000 : 2500,
      yAxisMinValue: (BenchmarkType.down === benchmarkType) ? 10 : 100,
      xAxisStepSize: 4,
      yAxisStepSize: (BenchmarkType.down === benchmarkType) ? 50 : 100,
      lineWidth: 5,
      xProject: x => (x === 0 ) ? 0 : Math.sign(x) * Math.log2(Math.abs(x)),
      yProject: y => (y === 0 ) ? 0 : Math.sign(y) * Math.log(Math.abs(y)),
      xAxisLabels: (x) => (testSizes.indexOf(x) > -1) ? this.humanReadableBytes(x) : '',
      yAxisLabels: (y, i) => (i < 10) ? this.humanReadableMilliseconds(y) : ' ',
    };

    if (benchmarkType === BenchmarkType.down) {
      this.downloadPlotter.reset(plotterSettings);
    }
    if (benchmarkType === BenchmarkType.up) {
      this.uploadPlotter.reset(plotterSettings);
    }
  }


  private loopBenchmarkSequence(type: BenchmarkType): Promise<void> {

    this.updateStatus(`Benchmark Loop ${type} nr.:`  + this.networkStats.get(type).length);
    const benchmarkDefinition = this.benchmarkDefinitions.get(type);
    return new Promise((resolve, reject) => {
      this.benchmarkSequence(type)
        .then(results => {
          const averageBytesPerSecond = NetworkCheckComponent.calculateAverageSpeedBytePerSecond(results);
          const averageOfPreviousLoops = this.getAverageNetworkStat(type);
          console.log({results: results, avg: averageBytesPerSecond});
          const errors = results.reduce((a, r) => a + ((r.error !== null) ? 1 : 0), 0);
          this.networkStats.get(type).push(averageBytesPerSecond);
          this.showBenchmarkSequenceResults(type, this.getAverageNetworkStat(type), results);

          if (errors > benchmarkDefinition.allowedErrorsPerSequence) {
            console.warn('some errors occured', results);
            return reject(errors);
          }

          if (this.networkStats.get(type).length > benchmarkDefinition.allowedSequenceRepetitions) {
            console.warn(`looped ${benchmarkDefinition.allowedSequenceRepetitions} times, but could not get reliable average`);
            return resolve();
          }

          if (
            (this.networkStats.get(type).length < 3) ||
            (Math.abs(averageOfPreviousLoops - averageBytesPerSecond) > benchmarkDefinition.allowedDevianceBytesPerSecond)
          ) {
            return this.loopBenchmarkSequence(type).then(resolve).catch(reject);
          }

          resolve();
        });
    });
  }


  private getAverageNetworkStat(type: BenchmarkType): number {

    return this.networkStats.get(type).reduce((a, x) => a + x, 0) / this.networkStats.get(type).length;
  }


  private benchmarkSequence(type: BenchmarkType): Promise<Array<NetworkRequestTestResult>> {

    return this.benchmarkDefinitions.get(type).testSizes.reduce(
      (sequence, testSize) => sequence.then(results => this.benchmark(type, testSize)
        .then(result => {
          results.push(result);
          return results;
        })
      ),
      Promise.resolve(new Array<NetworkRequestTestResult>())
    );
  }


  private benchmark(benchmarkType: BenchmarkType, requestSize: number): Promise<NetworkRequestTestResult> {

    // console.log(`run benchmark ${benchmarkType} for ${requestSize}`);
    const testRound = this.networkStats.get(benchmarkType).length + 1;
    const testPackage = this.humanReadableBytes(requestSize);
    if (benchmarkType === BenchmarkType.down) {
      this.updateStatus(`Downloadgeschwindigkeit Testrunde ${testRound} - Testgröße: ${testPackage} bytes`);
      return this.bs.benchmarkDownloadRequest(requestSize);
    } else {
      this.updateStatus(`Uploadgeschwindigkeit Testrunde ${testRound} - Testgröße: ${testPackage} bytes)`);
      return this.bs.benchmarkUploadRequest(requestSize);
    }
  }


  private showBenchmarkSequenceResults(type: BenchmarkType, avgBytesPerSecond: number, results: Array<NetworkRequestTestResult> = []) {

    if (type === BenchmarkType.down) {
      this.status.avgDownloadSpeedBytesPerSecond = avgBytesPerSecond;
    }
    if (type === BenchmarkType.up) {
      this.status.avgUploadSpeedBytesPerSecond = avgBytesPerSecond;
    }

    this.plotStatistics(type, results);
  }


  // tslint:disable-next-line:member-ordering
  private static calculateAverageSpeedBytePerSecond(testResults: Array<NetworkRequestTestResult>): number {

    return testResults.reduce((sum, result) => sum + (result.size / result.duration * 1000), 0) / testResults.length;
  }


  private plotStatistics(benchmarkType: BenchmarkType, benchmarkSequenceResults: Array<NetworkRequestTestResult>) {

    const datapoints = benchmarkSequenceResults
      .filter(measurement => (measurement.error === null))
      .map(measurement => ([measurement.size, measurement.duration]));

    if (benchmarkType === BenchmarkType.down) {
      this.downloadPlotter.plotData(datapoints, null, 'dots');
    }

    if (benchmarkType === BenchmarkType.up) {
      this.uploadPlotter.plotData(datapoints, null, 'dots');
    }

    return benchmarkSequenceResults;
  }

  private reportResults(isInstable: boolean = false): void {

    if (!isInstable) {
      this.calculateNetworkRating();
    } else {
      this.networkRating = {
        downloadRating: 'unstable',
        uploadRating: 'unstable',
        overallRating: 'unstable'
      };
    }

    this.updateStatus(`Die folgenden Netzwerkeigenschaften wurden festgestellt:`);
    this.testDone = true;

    // send data for reporting
    const reportEntry: ReportEntry[] = [];
    reportEntry.push({id: '0', type: 'network', label: 'Downloadgeschwindigkeit',
      value: this.humanReadableBytes(this.getAverageNetworkStat(BenchmarkType.down), true).toLocaleString()});
    reportEntry.push({id: '0', type: 'network', label: 'Downloadbewertung', value: this.networkRating.downloadRating});
    reportEntry.push({id: '0', type: 'network', label: 'Uploadgeschwindigkeit',
      value: this.humanReadableBytes(this.getAverageNetworkStat(BenchmarkType.up), true).toLocaleString()});
    reportEntry.push({id: '0', type: 'network', label: 'Uploadbewertung', value: this.networkRating.uploadRating});
    reportEntry.push({id: '0', type: 'network', label: 'Allgemeine Bewertung der Verbindung', value: this.networkRating.overallRating});

    if (this.detectedNetworkInformations.available) {
      if (this.detectedNetworkInformations.roundTripTimeMs) {
        reportEntry.push({
          id: '0', type: 'network', label: 'RoundTrip in Ms',
          value: this.detectedNetworkInformations.roundTripTimeMs.toString()
        });
      }
      if (this.detectedNetworkInformations.effectiveNetworkType) {
        reportEntry.push({
          id: '0', type: 'network', label: 'Netzwerktyp nach Leistung',
          value: this.detectedNetworkInformations.effectiveNetworkType
        });
      }
      if (this.detectedNetworkInformations.networkType) {
        reportEntry.push({
          id: '0', type: 'network', label: 'Netzwerktyp',
          value: this.detectedNetworkInformations.networkType
        });
      }
      if (this.detectedNetworkInformations.downlinkMegabitPerSecond) {
        reportEntry.push({
          id: '0', type: 'network', label: 'Downlink mbps',
          value: this.detectedNetworkInformations.downlinkMegabitPerSecond.toString()
        });
      }
    }
    this.ds.networkData$.next(reportEntry);
  }


  private updateStatus(newStatus: string): void {

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
        overallRating: 'N/A'
    };

    const nd = {
      avgDownloadSpeed: this.getAverageNetworkStat(BenchmarkType.down),
      avgUploadSpeed: this.getAverageNetworkStat(BenchmarkType.up),
    };
    console.log('measured averages', nd);

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

    awardedNetworkRating.overallRating = 'good';
    if (awardedNetworkRating.downloadRating === 'ok' || awardedNetworkRating.uploadRating === 'ok') {
      awardedNetworkRating.overallRating = 'ok';
    }

    if (awardedNetworkRating.downloadRating === 'insufficient' || awardedNetworkRating.uploadRating === 'insufficient') {
      awardedNetworkRating.overallRating = 'insufficient';
    }

    this.networkRating = awardedNetworkRating;
  }


  private getBrowsersNativeNetworkInformations() {

    const connection = navigator['connection'] || navigator['mozConnection'] || navigator['webkitConnection'];
    console.log('connection', connection);
    if (connection) {
      this.detectedNetworkInformations = {
        available: true,
        downlinkMegabitPerSecond: connection.downlink || null,
        effectiveNetworkType: connection.effectiveType || null,
        roundTripTimeMs: connection.rtt || null,
        networkType: connection.type || null,
      };
    }
  }


  private humanReadableBytes(bytes: number, useBits: boolean = false): string {

    const units = useBits
      ? ['b', 'kb', 'mb', 'gb', 'tb']
      : ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    if (useBits) {
      bytes /= 8;
    }

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(i))).toFixed(2) + ' ' + units[i];
  }

  private humanReadableMilliseconds = (milliseconds: number): string => (milliseconds / 1000).toString() + ' sec';

}
