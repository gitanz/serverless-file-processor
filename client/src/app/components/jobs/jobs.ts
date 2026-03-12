import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

export interface Job {
  id: string;
  totalRows: number;
  totalCompleted: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const MOCK_JOBS: Job[] = [
  { id: 'abc-123', totalRows: 100, totalCompleted: 80, status: 'IN_PROGRESS', createdAt: '2026-03-12T10:00:00Z', updatedAt: '2026-03-12T10:05:00Z' },
  { id: 'def-456', totalRows: 50, totalCompleted: 50, status: 'COMPLETED', createdAt: '2026-03-12T09:00:00Z', updatedAt: '2026-03-12T09:30:00Z' },
  { id: 'def-456', totalRows: 50, totalCompleted: 50, status: 'COMPLETED', createdAt: '2026-03-12T09:00:00Z', updatedAt: '2026-03-12T09:30:00Z' },
  { id: 'def-456', totalRows: 50, totalCompleted: 50, status: 'COMPLETED', createdAt: '2026-03-12T09:00:00Z', updatedAt: '2026-03-12T09:30:00Z' },
  { id: 'def-456', totalRows: 50, totalCompleted: 50, status: 'COMPLETED', createdAt: '2026-03-12T09:00:00Z', updatedAt: '2026-03-12T09:30:00Z' },
];

@Component({
  selector: 'app-jobs',
  imports: [MatTableModule, MatButtonModule],
  templateUrl: './jobs.html',
  styleUrl: './jobs.scss',
})
export class Jobs {
  displayedColumns = ['id', 'totalRows', 'totalCompleted', 'status', 'createdAt', 'updatedAt', 'actions'];
  jobs: Job[] = MOCK_JOBS;

  getDetails(job: Job) {
    console.log('Get details for job:', job.id);
  }
}
