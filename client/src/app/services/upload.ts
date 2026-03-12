import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadUrlResponse {
  jobId: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  constructor(private http: HttpClient) {}

  getUploadUrl(): Observable<UploadUrlResponse> {
    return this.http.get<UploadUrlResponse>(`${environment.apiUrl}/upload`);
  }

  uploadToPresignedUrl(url: string, file: File): Observable<void> {
    return this.http.put<void>(url, file);
  }
}
