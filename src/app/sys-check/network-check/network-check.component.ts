import { SyscheckDataService, NetworkData } from './../syscheck-data.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'iqb-network-check',
  templateUrl: './network-check.component.html',
  styleUrls: ['./network-check.component.css']
})
export class NetworkCheckComponent implements OnInit {
  status = '';
  testDone = false;
  averageSpeed = {
    uploadTest: -1,
    downloadTest: -1,
    pingTest: -1
  };

  constructor(
    private ds: SyscheckDataService
  ) { }

  ngOnInit() {

  }

  public startCheck() {
    const nwd: NetworkData = {
      uploadTest: -1,
      downloadTest: -1,
      pingTest: -1
    };

    console.log('started');

    this.networkCheck() ;
  }

  public networkCheck() {

    this.testDone = false;

    const testResults = [];

    let currentSize = 1024;
    let currentSizeIteration = 0;
    let currentSizePassed = 0;

    // test upload speeds

    const updateStatus = (newStatus: string) => {
        this.status = newStatus;
    };

    const benchmarkUploadRequest = (requestedUploadSize, timeout, callback) => {
        // uses https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout
        // and https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send

        updateStatus(`Uploadgeschwindigkeit wird getestet (${currentSize} bytes).`);

        let startingTime;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://ocba.iqb.hu-berlin.de/networkTest/uploadTest.php', true);

        xhr.timeout = timeout;

        // Send the proper header information along with the request
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onreadystatechange = function() { // Call a function when the state changes.
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                // Request finished. Do processing here.
                const currentTime = new Date().getTime();
                testResults.push({
                    'type': 'uploadTest',
                    'size': requestedUploadSize,
                    'duration': currentTime - startingTime
                });

                currentSizePassed++;
                callback();
            }
        };

        xhr.ontimeout = function (e) {
            // XMLHttpRequest timed out. Do something here.
            testResults.push({
                'type': 'uploadTest',
                'size': requestedUploadSize,
                'duration': -1 * xhr.timeout
            });
            callback();
        };

        let uploadedContent = '';
        for (let i = 1; i <= requestedUploadSize; i++)  {
          uploadedContent += String(Math.floor(Math.random() * 10));
        }
        startingTime = new Date().getTime();
        xhr.send('package=' + uploadedContent);
    };


    // test download speeds
    const benchmarkDownloadRequest = (requestedDownloadSize, timeout, callback) => {
        // uses https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout

        updateStatus(`Downloadgeschwindigkeit wird getestet (${currentSize} bytes).`);

        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://ocba.iqb.hu-berlin.de/networkTest/downloadTest.php?size=' +
                         requestedDownloadSize + '&uid=' + (new Date().getTime()), true);

        xhr.timeout = timeout;

        let startingTime;

        xhr.onload = function () {
            // Request finished. Do processing here.
            const currentTime = new Date().getTime();
            testResults.push({
                'type': 'downloadTest',
                'size': requestedDownloadSize,
                'duration': currentTime - startingTime
            });

            currentSizePassed++;
            callback();
        };

        xhr.ontimeout = function (e) {
            // XMLHttpRequest timed out. Do something here.
            testResults.push({
                'type': 'downloadTest',
                'size': requestedDownloadSize,
                'duration': -1 * xhr.timeout
            });
            callback();
        };

        startingTime = new Date().getTime();

        xhr.send(null);
    };

    const nextStepOfConnectionTest = (requestBenchmarkerFunction, callback) => {
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

            requestBenchmarkerFunction(currentSize, timeout, () => {
                // then
                nextStepOfConnectionTest(requestBenchmarkerFunction, callback);
            });
        } else {
            currentSize = 1024;
            currentSizeIteration = 0;
            currentSizePassed = 0;

            callback();
        }
    };

    updateStatus('Tests werden gestartet..');

    nextStepOfConnectionTest(benchmarkDownloadRequest, () => {
        // then
        nextStepOfConnectionTest(benchmarkUploadRequest, () => {
             // then
            // console.log('done');

            // console.log('Test results:');
            // console.log(testResults);
            // console.log(averageSpeed);

            updateStatus(`Done.`);
            this.testDone = true;

            this.ds.networkData$.next(this.averageSpeed);
        });
    });
  }

}
