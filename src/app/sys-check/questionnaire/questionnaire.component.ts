import { FormControl, FormGroup } from '@angular/forms';
import { FormDefEntry, ReportEntry } from '../backend.service';
import { SyscheckDataService } from '../syscheck-data.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'iqb-questionnaire',
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.css']
})
export class QuestionnaireComponent implements OnInit {
  @ViewChild('questionnaireBody', { static: true }) questionnaireBody: ElementRef;
  questionnaireEnabled = false;
  questions: FormDefEntry[] = [];
  form: FormGroup;

  constructor(
    private ds: SyscheckDataService
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
          if (question.value.length > 0) {
            question.options = question.value.split('#');
          }
          group[question.id] = new FormControl('');
        });
        this.form = new FormGroup(group);
        this.form.valueChanges.subscribe(f => {this.updateReport(); });
        this.updateReport();
      }
    });
  }

  private updateReport() {

    const myReportEntries: ReportEntry[] = [];
    this.questions.forEach(element => {
      if (element.type === 'header') {
        myReportEntries.push({'id': element.id, 'type': element.type, 'label': element.value, 'value': ''});
      } else {
        const myValue = this.form.controls[element.id].value;
        myReportEntries.push({'id': element.id, 'type': element.type, 'label': element.prompt, 'value': myValue});
      }
    });
    this.ds.questionnaireData$.next(myReportEntries);
  }

}
