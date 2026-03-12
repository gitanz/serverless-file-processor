import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { JobsService, Job } from '../../services/jobs';
import { JobResultsService } from '../../services/job-results';
import { UploadService } from '../../services/upload';
import { take, Subscription, skip } from 'rxjs';
import {LoadingService} from '../../services/loading';
import {MatDivider} from '@angular/material/list';

@Component({
  selector: 'app-jobs',
  imports: [MatTableModule, MatButtonModule, MatDivider],
  templateUrl: './jobs.html',
  styleUrl: './jobs.scss',
})
export class Jobs implements OnInit, OnDestroy {
  displayedColumns = ['id', 'totalRows', 'totalCompleted', 'status', 'createdAt', 'updatedAt'];
  jobs: Job[] = [];
  private fileUploadedSub!: Subscription;

  constructor(
    private jobsService: JobsService,
    private jobResultsService: JobResultsService,
    private uploadService: UploadService,
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.getJobs();

    this.fileUploadedSub = this.uploadService.fileUploaded$.pipe(
      skip(1)
    ).subscribe(() => this.getJobs());
  }

  ngOnDestroy() {
    this.fileUploadedSub.unsubscribe();
  }

  getJobs() {
    this.jobsService
      .getJobs()
      .pipe(
        take(1)
      )
      .subscribe({
        next: (jobs) => {
          this.jobs = jobs;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Failed to load jobs:', err),
      });
  }

  getDetails(job: Job) {
    this.jobResultsService.getJobResult(job.id).subscribe({
      next: (result) => this.jobResultsService.setJobResult(result),
      error: (err) => console.error('Failed to load job result:', err),
    });
  }
}
