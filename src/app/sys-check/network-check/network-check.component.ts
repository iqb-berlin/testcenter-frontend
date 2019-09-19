import { SyscheckDataService } from './../syscheck-data.service';
import { Component, OnInit } from '@angular/core';
import { BackendService, NetworkRequestTestResult, RequestBenchmarkerFunction,
      RequestBenchmarkerFunctionCallback, ReportEntry} from '../backend.service';

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

    const testResults: Array<NetworkRequestTestResult> = [];

    this.averageSpeed = {
        uploadTest: -1,
        downloadTest: -1,
        pingTest: -1
      };

    let currentSize = 1024;
    let currentSizeIteration = 0;
    let currentSizePassed = 0;

    // test upload speeds

    const updateStatus = (newStatus: string) => {
        this.status = newStatus;
    };

    const nextStepOfConnectionTest = (whatIsBeingTested: 'download' | 'upload',
                                      requestBenchmarkerFunction: RequestBenchmarkerFunction,
                                      callback: Function) => {
        currentSizeIteration++;
        let shouldContinue = true;

        if (currentSizeIteration > 3) {
            if (currentSizePassed === 0) {
              shouldContinue = false;
            }
            if (currentSize * 2 > 1024 * 1024 * 5) {
              shouldContinue = false;
            }

            if (currentSizePassed === 3) {
                // if there were 3 succesful requests at this size, calculate the average speed and save it as the latest result
                const currentTestResultIndex: number = testResults.length - 1;

                const type: string = testResults[currentTestResultIndex].type;

                const totalSize: number  =   testResults[currentTestResultIndex].size +
                                             testResults[currentTestResultIndex - 1].size +
                                             testResults[currentTestResultIndex - 2].size;

                const totalTime: number  =   testResults[currentTestResultIndex].duration +
                                            testResults[currentTestResultIndex - 1].duration +
                                            testResults[currentTestResultIndex - 2].duration;

                const currentAverageSpeed  = Math.floor(totalSize / totalTime) * 1000; // bytes / miliseconds * 1000 = bytes / second

                this.averageSpeed[type] = currentAverageSpeed;

                if (this.averageSpeed.pingTest === -1) {
                    // if ping is not yet discovered, mark it down
                    if (currentSize === 1024) {
                      this.averageSpeed.pingTest = Math.floor(totalTime / 3); // ping is given in miliseconds
                    }
                }
            }

            currentSizeIteration = 1;
            currentSize = currentSize * 2;
            currentSizePassed = 0;
        }

        if (shouldContinue) {
            const timeout = 1000 + (currentSizeIteration - 1) * 2000; // 1000 (1st iteration), 3000 (2nd iteration), 5000 (3rd iteration)

            if (whatIsBeingTested === 'download') {
                updateStatus(`Downloadgeschwindigkeit wird getestet... (Testgröße: ${currentSize} bytes; Test: ${currentSizeIteration}/3)`);
            }
            if (whatIsBeingTested === 'upload') {
                updateStatus(`Uploadgeschwindigkeit wird getestet... (Testgröße: ${currentSize} bytes; Test: ${currentSizeIteration}/3)`);
            }

            requestBenchmarkerFunction(currentSize, timeout, (testResult: NetworkRequestTestResult) => {
                // after the test is done

                testResults.push(testResult);
                if (testResult.duration >= 0) {
                    currentSizePassed++;
                }

                nextStepOfConnectionTest(whatIsBeingTested, requestBenchmarkerFunction, callback);
            });
        } else {
            currentSize = 1024;
            currentSizeIteration = 0;
            currentSizePassed = 0;

            callback();
        }
    };

    nextStepOfConnectionTest('download', (requestSize: number, timeout: number, callback: RequestBenchmarkerFunctionCallback) => {
        this.bs.benchmarkDownloadRequest(requestSize, timeout, callback);
    }, () => {
        // then

        nextStepOfConnectionTest('upload', (requestSize: number, timeout: number, callback: RequestBenchmarkerFunctionCallback) => {
            this.bs.benchmarkUploadRequest(requestSize, timeout, callback);
        }, () => {
             // then
            // console.log('done');

            // console.log('Test results:');
            // console.log(testResults);
            // console.log(averageSpeed);

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
    });
  }

  public calculateNetworkRating(nd: NetworkData): NetworkRating {
        // assumes that this.ds.checkConfig$ is already set;

        const testConfig = this.ds.checkConfig$.getValue();
        // console.log('Test configuration used to calculate network compatibility with the Test Center:');
        // console.log(testConfig);

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

