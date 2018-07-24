import { MAT_DIALOG_DATA } from '@angular/material';
import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  templateUrl: './editworkspace.component.html',
  styleUrls: ['./editworkspace.component.css']
})
export class EditworkspaceComponent implements OnInit {
  editworkspaceform: FormGroup;

  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.editworkspaceform = this.fb.group({
      name: this.fb.control('', [Validators.required, Validators.minLength(3)])
    });
  }
}
