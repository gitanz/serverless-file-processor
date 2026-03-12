import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadUrlResponse {
  jobId: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private fileUploadedSubject = new BehaviorSubject<boolean>(false);
  fileUploaded$ = this.fileUploadedSubject.asObservable();

  constructor(private http: HttpClient) {}

  getUploadUrl(): Observable<UploadUrlResponse> {
    return this.http.get<UploadUrlResponse>(`${environment.apiUrl}/upload`);
  }

  uploadToPresignedUrl(url: string, file: File): Observable<void> {
    return this.http.put<void>(url, file);
  }

  notifyFileUploaded() {
    this.fileUploadedSubject.next(true);
  }
}
