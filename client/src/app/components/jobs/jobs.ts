import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { JobsService, Job } from '../../services/jobs';

@Component({
  selector: 'app-jobs',
  imports: [MatTableModule, MatButtonModule],
  templateUrl: './jobs.html',
  styleUrl: './jobs.scss',
})
export class Jobs implements OnInit {
  displayedColumns = ['id', 'totalRows', 'totalCompleted', 'status', 'createdAt', 'updatedAt', 'actions'];
  jobs: Job[] = [];

  constructor(
    private jobsService: JobsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.jobsService.getJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load jobs:', err),
    });
  }

  getDetails(job: Job) {
    console.log('Get details for job:', job.id);
  }
}
