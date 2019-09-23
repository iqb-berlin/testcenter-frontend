import {Component, ElementRef, OnInit} from '@angular/core';
import {el} from '@angular/platform-browser/testing/src/browser_util';

@Component({
  selector: 'tc-speed-chart',
  template: '<canvas height="240" width="800" style="border: 1px solid black"></canvas>'
})
export class TcSpeedChartComponent implements OnInit {

  private canvas;
  private context;
  private el;
  private xScale;
  private yScale;

  public config = {
    gridColor: 'silver',
    axisColor: 'red',
    backgroundColor: 'black',
    font: '20 pt Verdana',
    xAxisStepSize: 10,
    yAxisStepSize: 20,
    margin: 4,
    xAxisLabels: (x, step) => '' + Math.round(x),
    yAxisLabels: (y, step) => step + '|' + Math.round(y),
    xAxisMaxValue: 200,
    xAxisMinValue: -20,
    yAxisMaxValue: 200,
    yAxisMinValue: -20
  };

  constructor(elem: ElementRef) {
    this.el = elem.nativeElement;
  }

  ngOnInit() {

    this.canvas = this.el.querySelector('canvas');
    this.context = this.canvas.getContext('2d');

    this.reset();

    // const Apple = [[0, -10], [10, 0], [20, 10], [30, 50], [40, 100], [50, 200], [60, 0]];
    // const Pi = [[100, -10], [90, 0], [80, 10], [70, 50], [60, 100], [50, 200], [40, 0]];
    //
    // this.plotData(Apple);
    // this.plotData(Pi);
  }

  public reset() {

    this.context.fillStyle = this.config.backgroundColor;
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.font = this.config.font;
    this.yScale = this.canvas.height / (this.config.yAxisMaxValue - this.config.yAxisMinValue);
    this.xScale = this.canvas.width / (this.config.xAxisMaxValue - this.config.xAxisMinValue);
    this.drawGridColumns();
    this.drawGridRows();
    this.context.translate(this.config.xAxisMinValue * this.xScale, this.canvas.height + (this.config.yAxisMinValue * this.yScale));
    this.context.scale(this.xScale, -1 * this.yScale);
  }

  public plotData(dataSet: Array<Array<number>>, color: string = null) {

    color = color || this.randomColor();
    const oldColor = this.context.strokeStyle;
    this.context.strokeStyle = color;
    this.context.beginPath();

    this.context.moveTo(dataSet[0][0], dataSet[0][1]);
    for (let i = 1; i < dataSet.length; i++) {
      console.log(dataSet[i]);
      this.context.lineTo(dataSet[i][0], dataSet[i][1]);
    }
    this.context.stroke();
    this.context.strokeStyle = oldColor;
  }

  private drawGridColumns() {

    for (
        let x = this.config.xAxisMinValue, count = 1;
        x < this.config.xAxisMaxValue;
        x = this.config.xAxisMinValue + count++ * this.config.xAxisStepSize) {
      const realX = this.xScale * (x - this.config.xAxisMinValue);
      console.log('x', x, realX);
      this.context.fillText(this.config.xAxisLabels(x, count), realX, this.canvas.height - this.config.margin);
      this.context.strokeStyle = (x === 0) ? this.config.axisColor : this.config.gridColor;
      this.context.beginPath();
      this.context.moveTo(realX, 0);
      this.context.lineTo(realX, this.canvas.height);
      this.context.stroke();
      count++;
    }
  }

  private drawGridRows() {

    for (
        let y = this.config.yAxisMinValue, count = 1;
        y < this.config.yAxisMaxValue;
        y = this.config.yAxisMinValue + count++ * this.config.yAxisStepSize) {
      const realY = this.canvas.height - this.yScale * (y - this.config.yAxisMinValue);
      this.context.fillText(this.config.yAxisLabels(y, count), this.config.margin, realY);
      this.context.strokeStyle = (y === 0) ? this.config.axisColor : this.config.gridColor;
      this.context.beginPath();
      this.context.moveTo(0, realY);
      this.context.lineTo(this.canvas.width, realY);
      this.context.stroke();
    }
  }


  private randomColor() {

    return 'rgb(' + new Array(3).fill(0).map(() => Math.round(256 * Math.random())).join(', ') + ')';
  }

}
