import { Pipe, PipeTransform } from '@angular/core';
import { MainDataService } from './maindata.service';

@Pipe({
  name: 'customText'
})
export class CustomTextPipe implements PipeTransform {

  constructor ( private mds: MainDataService ) {}

  transform(valueForChangeDetection: any, key: string): string {
    return this.mds.getCostumText(key);
  }
}
