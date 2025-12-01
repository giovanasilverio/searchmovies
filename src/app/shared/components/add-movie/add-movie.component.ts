import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';

import { DatabaseService } from '../../services/database.service';
import { OmdbService, OmdbMovie } from '../../services/omdb.service';

@Component({
  selector: 'app-add-movie',
  templateUrl: './add-movie.component.html',
  styleUrls: ['./add-movie.component.scss']
})
export class AddMovieComponent {

  movieForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isSaving = false;

  // controle do modo "preencher manualmente"
  omdbNotFound = false;   // true depois que a API não encontra o filme
  manualMode = false;     // quando true, não tenta mais chamar a OMDb

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
      rating: [0],
      analisys: [''],
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

    // Se já estamos no modo manual, NÃO chama a OMDb de novo,
    // apenas salva com o que o usuário preencheu.
    if (this.manualMode) {
      this.isSaving = true;

      const payload: any = {
        title: formData.name,
        analysis: formData.analisys,
        rating: formData.rating ?? 0
      };

      this.handleUploadAndSave(payload);
      return;
    }

    // Primeira tentativa: tenta buscar na OMDb
    this.isSaving = true;
    this.omdbNotFound = false;

    this.omdbService.getMovieByTitle(titleToSearch).subscribe({
      next: (omdb: OmdbMovie) => {
        console.log('OMDb retornou:', omdb);

        // 1) PLOT da OMDb vai para a análise
        const analysisFromPlot = omdb.plot || formData.analisys || '';

        // 2) omdb_rating (0–10) vai para rating (0–5 estrelas)
        let ratingFromOmdb = formData.rating ?? 0;
        if (omdb.rating && omdb.rating !== 'N/A') {
          const imdbNumber = Number(omdb.rating);
          if (!isNaN(imdbNumber)) {
            // converte 0–10 para 0–5
            ratingFromOmdb = Math.round(Math.max(0, Math.min(imdbNumber, 10)) / 2);
          }
        }

        // Atualiza o formulário pra usuário ver os dados vindos da API
        this.movieForm.patchValue({
          analisys: analysisFromPlot,
          rating: ratingFromOmdb
        });

        const payload: any = {
          // formato que a Home está esperando
          title: omdb.title || formData.name,
          analysis: analysisFromPlot,      // <- plot na análise
          rating: ratingFromOmdb,          // <- rating vindo da OMDb (convertido)

          // campos extras da OMDb, se quiser usar depois
          omdb_title: omdb.title,
          omdb_rating: omdb.rating,
          omdb_plot: omdb.plot,
          omdb_poster: omdb.poster
        };

        // se não tiver upload e houver poster da OMDb, usa ele como imagem
        if (!this.selectedFile && omdb.poster && omdb.poster !== 'N/A') {
          payload.photoPath = omdb.poster;
        }

        this.handleUploadAndSave(payload);
      },
      error: (err) => {
        console.error('Erro ao consultar OMDb:', err);
        this.isSaving = false;

        // Marca que não encontrou / falhou e habilita modo manual
        this.omdbNotFound = true;
        this.manualMode = true;

        alert(
          'Filme não encontrado na OMDb ou houve um erro na consulta.\n\n' +
          'Agora você pode preencher os dados manualmente (nome, análise, nota, imagem)\n' +
          'e clicar em "Adicionar" novamente para salvar o filme só com essas informações.'
        );
      }
    });
  }

  private handleUploadAndSave(payload: any): void {
    // Se tiver arquivo selecionado, faz upload primeiro
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
        this.omdbNotFound = false;
        this.manualMode = false;
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
