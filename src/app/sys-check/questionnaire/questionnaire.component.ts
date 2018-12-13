import { SyscheckDataService } from './../syscheck-data.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'iqb-questionnaire',
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.css']
})
export class QuestionnaireComponent implements OnInit {
  questionnaireEnabled = false;

  constructor(
    private ds: SyscheckDataService
  ) {
  }

  ngOnInit() {
    this.ds.questionnaireEnabled$.subscribe(is => this.questionnaireEnabled = is);
  }

}
