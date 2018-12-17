import { FormDefEntry } from './../backend.service';
import { SyscheckDataService } from './../syscheck-data.service';
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
      }
    });
  }

}
