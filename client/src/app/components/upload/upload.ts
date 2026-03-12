import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { UploadService } from '../../services/upload';
import { LoadingService } from '../../services/loading';
import {switchMap, finalize, take} from 'rxjs';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-upload',
  imports: [MatButtonModule, FormsModule],
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
})
export class Upload {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  selectedFile: File | null = null;

  constructor(
    private uploadService: UploadService,
    private loadingService: LoadingService,
  ) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.selectedFile) return;

    this.loadingService.show();

    this.uploadService.getUploadUrl().pipe(
      switchMap(({ jobId, url }) => {
        return this.uploadService.uploadToPresignedUrl(url, this.selectedFile!);
      }),
      finalize(() => {
        this.loadingService.hide();
        this.selectedFile = null;
        this.fileInput.nativeElement.value = '';
      }),
      take(1)
    ).subscribe({
      next: () => {
        console.log('File uploaded successfully');
        this.uploadService.notifyFileUploaded();
      },
      error: (err) => console.error('Upload failed:', err),
    });
  }
}
