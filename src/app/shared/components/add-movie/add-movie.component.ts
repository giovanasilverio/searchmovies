import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';

import { DatabaseService } from '../../services/database.service';
import { OmdbService, OmdbMovie } from '../../services/omdb.service';

@Component({
  selector: 'app-add-movie',
  templateUrl: './add-movie.component.html',
  styleUrl: './add-movie.component.scss'
})
export class AddMovieComponent {

  movieForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isSaving = false;

  @Output() closeModal = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private storage: AngularFireStorage,
    private omdbService: OmdbService
  ) {}

  ngOnInit(): void {
    this.movieForm = this.fb.group({
      name: ['', [Validators.required]],
      rating: [0, [Validators.required]],
      analisys: ['', [Validators.required]],
      photo_path: ['']
    });
  }

  setRating(rating: number): void {
    this.movieForm.patchValue({ rating });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit(): void {
    if (!this.movieForm.valid || this.isSaving) return;

    const formData = this.movieForm.value;
    const titleToSearch: string = formData.name?.trim();

    if (!titleToSearch) {
      alert('Informe um nome para o filme.');
      return;
    }

    this.isSaving = true;

    // 1) buscar na OMDb
    this.omdbService.getMovieByTitle(titleToSearch).subscribe({
      next: (omdb: OmdbMovie) => {
        const payload: any = {
          // formato que a Home usa
          title: omdb.title || formData.name,
          analysis: formData.analisys || omdb.plot,
          rating: formData.rating ?? 0,

          // extras se quiser usar depois
          omdb_title: omdb.title,
          omdb_rating: omdb.rating,
          omdb_plot: omdb.plot,
          omdb_poster: omdb.poster
        };

        if (!this.selectedFile && omdb.poster && omdb.poster !== 'N/A') {
          payload.photoPath = omdb.poster;
        }

        this.handleUploadAndSave(payload);
      },
      error: (err) => {
        console.error('Erro ao consultar OMDb, salvando só dados locais:', err);

        const payload: any = {
          title: formData.name,
          analysis: formData.analisys,
          rating: formData.rating ?? 0
        };

        this.handleUploadAndSave(payload);
      }
    });
  }

  private handleUploadAndSave(payload: any): void {
    if (this.selectedFile) {
      const fileName = this.selectedFile.name;
      const storagePath = `asimovies/${Date.now()}_${fileName}`;
      const fileRef = this.storage.ref(storagePath);
      const task = this.storage.upload(storagePath, this.selectedFile);

      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            payload.photo_path = storagePath;
            payload.photoPath = url;
            this.saveMovie(payload);
          });
        })
      ).subscribe();
    } else {
      this.saveMovie(payload);
    }
  }

  private saveMovie(payload: any): void {
    this.databaseService.addDocument('movies', payload)
      .then(() => {
        console.log('Filme adicionado:', payload);
        this.movieForm.reset();
        this.selectedFile = null;
        this.previewUrl = null;
        this.isSaving = false;
        this.onClose();
      })
      .catch((error) => {
        console.error('Erro ao salvar filme no Firestore:', error);
        this.isSaving = false;
        alert('Erro ao salvar filme no Firestore.');
      });
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
