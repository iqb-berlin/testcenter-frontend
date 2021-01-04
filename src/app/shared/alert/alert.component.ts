import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'alert',
  template: '<span [innerHTML]="transform(text)"></span>',
  styles: ['.highlight {color: #003333}'],
  encapsulation: ViewEncapsulation.None
})
export class AlertComponent {
  @Input() text: string;

  transform = (text: string): string => text.replace(
    /\u0060([^\u0060]+)\u0060/g,
    (match, match2) => `<span style='color:green' class='highlight'>${match2}</span>`
  );
}
