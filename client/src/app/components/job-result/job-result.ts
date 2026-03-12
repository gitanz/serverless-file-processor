import { Component } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { JobResultsService } from '../../services/job-results';

@Component({
  selector: 'app-job-result',
  imports: [NgIf, AsyncPipe, MatTableModule],
  templateUrl: './job-result.html',
  styleUrl: './job-result.scss',
})
export class JobResultComponent {
  displayedColumns = ['field', 'value'];

  constructor(public jobResultsService: JobResultsService) {}
}
