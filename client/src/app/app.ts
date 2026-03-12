import { Component } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Upload } from './components/upload/upload';
import { Jobs } from './components/jobs/jobs';
import { JobResultComponent } from './components/job-result/job-result';
import { LoadingService } from './services/loading';

@Component({
  selector: 'app-root',
  imports: [MatToolbarModule, MatProgressBarModule, MatDividerModule, NgIf, AsyncPipe, Upload, Jobs, JobResultComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(public loadingService: LoadingService) {}
}
