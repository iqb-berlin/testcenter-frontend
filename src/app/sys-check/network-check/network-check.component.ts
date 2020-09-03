import { SysCheckDataService } from '../sys-check-data.service';
import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BackendService} from '../backend.service';
import {Subscription} from 'rxjs';
import {
  DetectedNetworkInformation,
  NetworkCheckStatus,
  NetworkRating, NetworkRequestTestResult, ReportEntry
} from '../sys-check.interfaces';

@Component({
  selector: 'iqb-network-check',
  templateUrl: './network-check.component.html'
})

export class NetworkCheckComponent implements OnInit, OnDestroy {
  private taskSubscription: Subscription = null;

  constructor(
    private ds: SysCheckDataService,
    private bs: BackendService
  ) {}

  @ViewChild('downloadChart', {static: true}) downloadPlotter;
  @ViewChild('uploadChart', {static: true}) uploadPlotter;

  @Input() measureNetwork: boolean;

  public status: NetworkCheckStatus = {
    done: true,
    message: 'Messung noch nicht gestartet',
    avgUploadSpeedBytesPerSecond: -1,
    avgDownloadSpeedBytesPerSecond: -1
  };

  private networkStatsDownload: number[] = [];
  private networkStatsUpload: number[] = [];

  public networkRating: NetworkRating = {
    downloadRating: 'N/A',
    uploadRating: 'N/A',
    overallRating: 'N/A'
  };

  public detectedNetworkInformations: DetectedNetworkInformation = {
    downlinkMegabitPerSecond: null,
    effectiveNetworkType: null,
    roundTripTimeMs: null,
    networkType: null,
    available: false
  };

  // tslint:disable-next-line:member-ordering
  private static calculateAverageSpeedBytePerSecond(testResults: Array<NetworkRequestTestResult>): number {

    return testResults.reduce((sum, result) => sum + (result.size / (result.duration / 1000)), 0) / testResults.length;
  }

  ngOnInit() {

    this.getBrowsersNativeNetworkInformation();
    const report: ReportEntry[] = [];
    this.addBrowsersNativeNetworkInformationToReport(report);
    this.ds.networkData$.next(report);

    this.taskSubscription = this.ds.task$.subscribe((task) => {
      if (task === 'speedtest') {
        this.startCheck();
      }
    });
  }

  public startCheck() {

    this.status = {
      done: false,
      message: 'Netzwerk-Analyse wird gestartet',
      avgUploadSpeedBytesPerSecond: -1,
      avgDownloadSpeedBytesPerSecond: -1
    };

    // ?? const myConfig = this.ds.checkConfig$.getValue();
    this.plotPrepare(true);
    this.plotPrepare(false);

    this.loopBenchmarkSequence(true)
      .then(() => this.loopBenchmarkSequence(false))
      .then(() => this.reportResults())
      .catch(() => this.reportResults(true));
  }

  private plotPrepare(isDownloadPart: boolean) {
    const testSizes = (isDownloadPart) ? this.ds.checkConfig.downloadSpeed.sequenceSizes : this.ds.checkConfig.uploadSpeed.sequenceSizes;
    const plotterSettings = {
      css: 'border: 1px solid silver; margin: 2px; width: 100%;',
      width: 800,
      height: 240,
      labelPadding: 4,
      xAxisMaxValue: 16 + Math.max(...testSizes),
      xAxisMinValue: Math.min(...testSizes),
      yAxisMaxValue: (isDownloadPart) ? 1200 : 2500,
      yAxisMinValue: (isDownloadPart) ? 20 : 100,
      xAxisStepSize: 4,
      yAxisStepSize: (isDownloadPart) ? 50 : 100,
      lineWidth: 5,
      xProject: x => (x === 0 ) ? 0 : Math.sign(x) * Math.log2(Math.abs(x)),
      yProject: y => (y === 0 ) ? 0 : Math.sign(y) * Math.log(Math.abs(y)),
      xAxisLabels: (x) => (testSizes.indexOf(x) > -1) ? this.humanReadableBytes(x, false, true) : '',
      yAxisLabels: (y, i) => (i < 10) ? this.humanReadableMilliseconds(y) : ' ',
    };

    if (isDownloadPart) {
      this.downloadPlotter.reset(plotterSettings);
    } else {
      this.uploadPlotter.reset(plotterSettings);
    }
  }

  private loopBenchmarkSequence(isDownloadPart: boolean): Promise<void> {
    if (isDownloadPart) {
      this.updateStatus(`Benchmark Loop Download nr.:`  + this.networkStatsDownload.length);
    } else {
      this.updateStatus(`Benchmark Loop Upload nr.:`  + this.networkStatsUpload.length);
    }
    const benchmarkDefinition = (isDownloadPart) ? this.ds.checkConfig.downloadSpeed : this.ds.checkConfig.uploadSpeed;
    return new Promise((resolve, reject) => {
      this.benchmarkSequence(isDownloadPart)
        .then(results => {
          const averageBytesPerSecond = NetworkCheckComponent.calculateAverageSpeedBytePerSecond(results);
          const averageOfPreviousLoops = this.getAverageNetworkStat(isDownloadPart);
          const errors = results.reduce((a, r) => a + ((r.error !== null) ? 1 : 0), 0);
          let statsLength;
          if (isDownloadPart) {
            this.networkStatsDownload.push(averageBytesPerSecond);
            statsLength = this.networkStatsDownload.length;
          } else {
            this.networkStatsUpload.push(averageBytesPerSecond);
            statsLength = this.networkStatsUpload.length;
          }
          this.showBenchmarkSequenceResults(isDownloadPart, this.getAverageNetworkStat(isDownloadPart), results);

          if (errors > benchmarkDefinition.maxErrorsPerSequence) {
            console.warn('network check: some errors occurred during', results);
            return reject(errors);
          }

          if (statsLength > benchmarkDefinition.maxSequenceRepetitions) {
            console.warn(`network check: looped ${benchmarkDefinition.maxSequenceRepetitions} times, but could not get reliable average`);
            return resolve();
          }

          if (
            (statsLength < 3) ||
            (Math.abs(averageOfPreviousLoops - averageBytesPerSecond) > benchmarkDefinition.maxDevianceBytesPerSecond)
          ) {
            return this.loopBenchmarkSequence(isDownloadPart).then(resolve).catch(reject);
          }

          resolve();
        });
    });
  }

  private getAverageNetworkStat(isDownloadPart: boolean): number {
    return (isDownloadPart) ?
      (this.networkStatsDownload.reduce((a, x) => a + x, 0) / this.networkStatsDownload.length) :
      (this.networkStatsUpload.reduce((a, x) => a + x, 0) / this.networkStatsUpload.length);
  }

  private benchmarkSequence(isDownloadPart: boolean): Promise<Array<NetworkRequestTestResult>> {
    const benchmarkDefinition = (isDownloadPart) ? this.ds.checkConfig.downloadSpeed : this.ds.checkConfig.uploadSpeed;

    return benchmarkDefinition.sequenceSizes.reduce(
      (sequence, testSize) => sequence.then(results => this.benchmark(isDownloadPart, testSize)
        .then(result => {
          results.push(result);
          return results;
        })
      ),
      Promise.resolve(new Array<NetworkRequestTestResult>())
    );
  }


  private benchmark(isDownloadPart: boolean, requestSize: number): Promise<NetworkRequestTestResult> {
    const testRound = (isDownloadPart) ? (this.networkStatsDownload.length + 1) : (this.networkStatsUpload.length + 1);
    const testPackage = this.humanReadableBytes(requestSize);
    if (isDownloadPart) {
      this.updateStatus(`Downloadgeschwindigkeit Testrunde ${testRound} - Testgröße: ${testPackage} bytes`);
      return this.bs.benchmarkDownloadRequest(requestSize);
    } else {
      this.updateStatus(`Uploadgeschwindigkeit Testrunde ${testRound} - Testgröße: ${testPackage})`);
      return this.bs.benchmarkUploadRequest(requestSize);
    }
  }


  private showBenchmarkSequenceResults(isDownloadPart: boolean, avgBytesPerSecond: number, results: Array<NetworkRequestTestResult> = []) {

    if (isDownloadPart) {
      this.status.avgDownloadSpeedBytesPerSecond = avgBytesPerSecond;
    } else {
      this.status.avgUploadSpeedBytesPerSecond = avgBytesPerSecond;
    }

    this.plotStatistics(isDownloadPart, results);
  }


  private plotStatistics(isDownloadPart: boolean, benchmarkSequenceResults: Array<NetworkRequestTestResult>) {

    const datapoints = benchmarkSequenceResults
      .filter(measurement => (measurement.error === null))
      .map(measurement => ([measurement.size, measurement.duration]));

    if (isDownloadPart) {
      this.downloadPlotter.plotData(datapoints, null, 'dots');
    } else {
      this.uploadPlotter.plotData(datapoints, null, 'dots');
    }

    return benchmarkSequenceResults;
  }

  private reportResults(isInstable: boolean = false): void {

    if (!isInstable) {
      this.updateNetworkRating();
    } else {
      this.networkRating = {
        downloadRating: 'unstable',
        uploadRating: 'unstable',
        overallRating: 'unstable'
      };
    }

    this.updateStatus(`Die folgenden Netzwerkeigenschaften wurden festgestellt:`);
    this.status.done = true;

    const downAvg = this.getAverageNetworkStat(true);
    const upAvg = this.getAverageNetworkStat(false);
    const report: ReportEntry[] = [];
    const reportEntry = (key: string, value: string, warning: boolean = false): void => {
      report.push({
        id: '0',
        type: 'network',
        label: key,
        value: value,
        warning: warning
      });
    };

    reportEntry('Downloadgeschwindigkeit', this.humanReadableBytes(downAvg, true) + '/s');
    reportEntry('Downloadgeschwindigkeit benötigt', this.humanReadableBytes(this.ds.checkConfig.downloadSpeed.min, true) + '/s');
    reportEntry('Downloadbewertung', this.networkRating.downloadRating, this.networkRating.downloadRating === 'insufficient');
    reportEntry('Uploadgeschwindigkeit', this.humanReadableBytes(upAvg, true) + '/s');
    reportEntry('Uploadgeschwindigkeit benötigt', this.humanReadableBytes(this.ds.checkConfig.uploadSpeed.min, true) + '/s');
    reportEntry('Uploadbewertung', this.networkRating.uploadRating, this.networkRating.uploadRating === 'insufficient');
    reportEntry('Gesamtbewertung', this.networkRating.overallRating, this.networkRating.overallRating === 'insufficient');

    this.addBrowsersNativeNetworkInformationToReport(report);

    this.ds.nextTask();
    this.ds.networkData$.next(report);
  }

  private updateStatus(newStatus: string): void {

    this.status.message = newStatus;
  }


  public updateNetworkRating(): void {
    const awardedNetworkRating: NetworkRating = {
        downloadRating: 'N/A',
        uploadRating: 'N/A',
        overallRating: 'N/A'
    };

    const nd = {
      avgDownloadSpeed: this.getAverageNetworkStat(true),
      avgUploadSpeed: this.getAverageNetworkStat(false),
    };

    // the ratings are calculated individually, by a "how low can you go" approach

    awardedNetworkRating.downloadRating = 'good';
    if (nd.avgDownloadSpeed < this.ds.checkConfig.downloadSpeed.good) {
        awardedNetworkRating.downloadRating = 'ok';
    }
    if (nd.avgDownloadSpeed < this.ds.checkConfig.downloadSpeed.min) {
        awardedNetworkRating.downloadRating = 'insufficient';
    }

    awardedNetworkRating.uploadRating = 'good';
    if (nd.avgUploadSpeed < this.ds.checkConfig.uploadSpeed.good) {
        awardedNetworkRating.uploadRating = 'ok';
    }
    if (nd.avgUploadSpeed < this.ds.checkConfig.uploadSpeed.min) {
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


  private getBrowsersNativeNetworkInformation() {

    const connection = navigator['connection'] || navigator['mozConnection'] || navigator['webkitConnection'];
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

  private addBrowsersNativeNetworkInformationToReport(report: ReportEntry[]): ReportEntry[] {

    if (this.detectedNetworkInformations.available) {
      if (this.detectedNetworkInformations.roundTripTimeMs) {
        report.push({
         id: '0', type: 'network', label: 'RoundTrip in Ms', warning: false,
         value: this.detectedNetworkInformations.roundTripTimeMs.toString()
      });
      }
      if (this.detectedNetworkInformations.effectiveNetworkType) {
        report.push({
          id: '0', type: 'network', label: 'Netzwerktyp nach Leistung', warning: false,
          value: this.detectedNetworkInformations.effectiveNetworkType
        });
      }
      if (this.detectedNetworkInformations.networkType) {
        report.push({
          id: '0', type: 'network', label: 'Netzwerktyp', warning: false,
          value: this.detectedNetworkInformations.networkType
        });
      }
      if (this.detectedNetworkInformations.downlinkMegabitPerSecond) {
        report.push({
          id: '0', type: 'network', label: 'Downlink MB/s', warning: false,
          value: this.detectedNetworkInformations.downlinkMegabitPerSecond.toString()
        });
      }
    } else {
      report.push({
        id: '0', type: 'network', label: 'Netzwerkprofil des Browsers', warning: true,
        value: 'nicht verfügbar'
      });
    }
    return report;
  }


  private humanReadableBytes(bytes: number, useBits: boolean = false, base1024: boolean = false): string {

    const suffix = {
      B: {
        1000: ['B', 'kB', 'MB', 'GB', 'TB'],
        1024: ['B', 'KiB', 'MiB', 'GiB', 'TiB']
      },
      bit: {
        1000: ['bit', 'kbit', 'Mbit', 'Gbit', 'Tbit'],
        1024: ['bit', 'kibit', 'Mibit', 'Gibit', 'Tibit']
      }
    };

    if (useBits) {
      bytes *= 8;
    }

    const base = base1024 ? 1024 : 1000;

    const i = Math.floor(Math.log(bytes) / Math.log(base));

    return !bytes && '0' || (bytes / Math.pow(base, i)).toFixed(2) + ' ' + suffix[!useBits ? 'B' : 'bit'][base][i];
  }

  private humanReadableMilliseconds = (milliseconds: number): string => (milliseconds / 1000).toString() + ' sec';

  ngOnDestroy() {
    if (this.taskSubscription !== null) {
      this.taskSubscription.unsubscribe();
    }
  }
}
