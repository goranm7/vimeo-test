import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'vimeo-test';

  videoFile: File | null = null;
  videoPreview: string | null = null;
  uploading = false;
  uploadProgress = 0;

  // Replace with your Vimeo token
  vimeoApiKey: string = ''; // user-provided key

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.videoFile = file;
      this.videoPreview = URL.createObjectURL(file);
    }
  }

  uploadToVimeo(): void {
    if (!this.videoFile) return;

    this.uploading = true;
    this.uploadProgress = 0;

    const createVideoUrl = 'https://api.vimeo.com/me/videos';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.vimeoApiKey}`,
      'Content-Type': 'application/json',
    });

    const body = {
      upload: {
        approach: 'tus',
        size: this.videoFile.size
      },
      name: this.videoFile.name,
      description: 'Uploaded from Angular app'
    };

    this.http.post<any>(createVideoUrl, body, { headers }).subscribe({
      next: (res) => {
        const uploadLink = res.upload.upload_link;
        this.uploadFile(uploadLink);
      },
      error: (err) => {
        this.toastr.error('Upload failed: ' + err.error.error, 'Error');
        this.uploading = false;
      }
    });
  }

  private uploadFile(uploadLink: string): void {
    if (!this.videoFile) return;

    const xhr = new XMLHttpRequest();
    xhr.open('PATCH', uploadLink, true);
    xhr.setRequestHeader('Tus-Resumable', '1.0.0');
    xhr.setRequestHeader('Upload-Offset', '0');
    xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        this.uploadProgress = Math.round((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 204 || xhr.status == 200) {
        this.toastr.success('Upload complete!', 'Success 🎉');
      } else {
        this.toastr.error('Upload failed.', 'Error');
      }
      this.uploading = false;
    };

    xhr.onerror = () => {
      this.toastr.error('Network error while uploading.', 'Error');
      this.uploading = false;
    };

    xhr.send(this.videoFile);
  }
}
