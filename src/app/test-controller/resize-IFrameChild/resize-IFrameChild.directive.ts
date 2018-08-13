import { Component, Directive, ElementRef, EventEmitter, HostListener,
    Input, OnDestroy, OnInit, Output } from '@angular/core';


  @Directive({
    selector: 'div[iqbResizeIFrameChild]'
  })
  export class ResizeIFrameChildDirective  {


    private _element: HTMLElement;

    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    constructor(private element: ElementRef) {
        this._element = this.element.nativeElement;
    }


    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    @HostListener('window:resize')
    public onResize(): any {
      const iFrameList = this._element.getElementsByTagName('iframe');
      if (iFrameList.length > 0) {
        let myIFrame: HTMLIFrameElement;
        myIFrame = iFrameList[0];
        const divHeight = this._element.clientHeight;
        myIFrame.setAttribute('height', String(divHeight));
      }
    }
  }
