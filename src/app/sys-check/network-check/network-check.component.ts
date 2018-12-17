import { SyscheckDataService, NetworkRequestTestResult } from './../syscheck-data.service';
import { Component, OnInit } from '@angular/core';
import { BackendService, RequestBenchmarkerFunction, RequestBenchmarkerFunctionCallback} from '../backend.service';

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

  constructor(
    private ds: SyscheckDataService,
    private bs: BackendService
  ) { }

  ngOnInit() {

  }

  public startCheck() {
    console.log('started');

    this.networkCheck() ;
  }

  public networkCheck() {

    this.testDone = false;

    const testResults: Array<NetworkRequestTestResult> = [];

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
            const timeout = currentSizeIteration * 3000; // 3000 (1st iteration), 6000 (2nd iteration), 9000 (3rd iteration)

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

            updateStatus(`Die folgenden Netzwerkeigenschaften wurden festgestellt:`);
            this.testDone = true;

            // this.ds.networkData$.next({
               //  'uploadTest': this.averageSpeed.uploadTest,
//                 'downloadTest': this.averageSpeed.downloadTest,
   //              'pingTest': this.averageSpeed.pingTest
      //       });

        });
    });
  }

}

export interface AverageSpeed {
  uploadTest: number;
  downloadTest: number;
  pingTest: number;
}
