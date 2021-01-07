import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'alert',
  templateUrl: 'alert.component.html',
  styleUrls: ['alert.css'],
  encapsulation: ViewEncapsulation.None
})
export class AlertComponent {
  @Input() text: string;
  @Input() level: 'error' | 'warning' | 'info' | 'success';

  public icons = {
    'error': 'error',
    'warning': 'warning',
    'info': 'info',
    'success': 'check_circle'
  }

  transform = (text: string): string => text.replace(
    /\u0060([^\u0060]+)\u0060/g,
    (match, match2) => `<span class='highlight'>${match2}</span>`
  );
}
