import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface JobResult {
  jobId: string;
  totalSales: number;
  averageSales: number;
  processedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KeyValuePair {
  field: string;
  value: any;
}

@Injectable({
  providedIn: 'root',
})
export class JobResultsService {
  private jobResultSubject = new BehaviorSubject<KeyValuePair[]>([]);
  jobResult$ = this.jobResultSubject.asObservable();

  constructor(private http: HttpClient) {}

  getJobResult(jobId: string): Observable<JobResult> {
    return this.http.get<JobResult>(`${environment.apiUrl}/jobs/${jobId}/result`);
  }

  setJobResult(result: JobResult) {
    this.jobResultSubject.next([
      { field: 'Job ID', value: result.jobId },
      { field: 'Total Sales', value: result.totalSales },
      { field: 'Average Sales', value: result.averageSales },
      { field: 'Processed Count', value: result.processedCount },
      { field: 'Created At', value: result.createdAt },
      { field: 'Updated At', value: result.updatedAt },
    ]);
  }

  clear() {
    this.jobResultSubject.next([]);
  }
}
