import { Component } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Upload } from './components/upload/upload';
import { Jobs } from './components/jobs/jobs';
import {LoadingService} from './services/loading';

import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-root',
  imports: [MatToolbarModule, MatProgressBarModule, MatDividerModule, NgIf, AsyncPipe, Upload, Jobs],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {

  constructor(public loadingService: LoadingService) {}
}
