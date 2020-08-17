import { FormControl, FormGroup } from '@angular/forms';
import { SysCheckDataService } from '../sys-check-data.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormDefEntry, ReportEntry } from '../sys-check.interfaces';
import { CustomtextService } from 'iqb-components';

@Component({
  selector: 'iqb-questionnaire',
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.css']
})
export class QuestionnaireComponent implements OnInit {
  @ViewChild('questionnaireBody', { static: true }) questionnaireBody: ElementRef;
  questions: FormDefEntry[] = [];
  form: FormGroup;

  constructor(
    private ds: SysCheckDataService,
    public cts: CustomtextService
  ) {
  }

  ngOnInit() {
    this.ds.checkConfig$.subscribe(cc => {
      if (cc === null) {
        this.questions = [];
      } else {
        this.questions = cc.questions;
        const group: any = {};
        this.questions.forEach(question => {
          group[question.id] = new FormControl('');
        });
        this.form = new FormGroup(group);
        this.form.valueChanges.subscribe(() => {this.updateReport(); });
        this.updateReport();
      }
    });
  }

  private updateReport() {

    const myReportEntries: ReportEntry[] = [];
    this.questions.forEach(element => {
      if (element.type !== 'header') {
        const value = this.form.controls[element.id].value;
        const warning = (['string', 'select', 'radio', 'text'].indexOf(element.type) > -1) && (value === '') && (element.required);
        myReportEntries.push({'id': element.id, 'type': element.type, 'label': element.prompt, 'value': value, warning: warning});
      }
    });
    this.ds.questionnaireData$.next(myReportEntries);
  }

}
