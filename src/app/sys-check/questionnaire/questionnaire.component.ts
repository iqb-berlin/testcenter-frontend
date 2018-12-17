import { FormControl, FormGroup } from '@angular/forms';
import { FormDefEntry } from './../backend.service';
import { SyscheckDataService, ReportEntry } from './../syscheck-data.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'iqb-questionnaire',
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.css']
})
export class QuestionnaireComponent implements OnInit {
  @ViewChild('questionnaireBody') questionnaireBody: ElementRef;
  questionnaireEnabled = false;
  formdef: FormDefEntry[] = [];
  form: FormGroup;

  constructor(
    private ds: SyscheckDataService
  ) {
  }

  ngOnInit() {
    this.ds.questionnaireEnabled$.subscribe(is => this.questionnaireEnabled = is);
    this.ds.checkConfig$.subscribe(cc => {
      if (cc === null) {
        this.formdef = [];
      } else {
        this.formdef = cc.formdef;
        const group: any = {};

        this.formdef.forEach(question => {
          group[question.id] = new FormControl('');
        });
        this.form = new FormGroup(group);
        this.form.valueChanges.subscribe(f => {
          const myReportEntries: ReportEntry[] = [];
          this.formdef.forEach(element => {
            const myValue = this.form.controls[element.id].value;
            myReportEntries.push({'label': element.prompt, 'value': myValue});
          });
          this.ds.questionnaireData$.next(myReportEntries);
        });
      }
    });
  }

}
