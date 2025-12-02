import { Component } from '@angular/core';
import { DatabaseService } from '../../shared/services/database.service'; 

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  showAddMovieModal: boolean = false;
  searchQuery: string = '';
  displayedMovies: any[] = [];
  movies: any[] = [];
  limit: number = 4;
  currentOffset: number = 0;
  showEditModal: boolean = false;
  movieBeingEdited: any | null = null;
  editedAnalysis: string = '';

  constructor(private databaseService: DatabaseService) {}

  ngOnInit(){
    // Busca em tempo real a coleção 'movies' no Firestore
    this.databaseService.getCollection('movies').subscribe((movies: any[]) => {
      this.movies = movies;
      this.currentOffset = 0;
      this.displayedMovies = this.movies.slice(this.currentOffset, this.currentOffset + this.limit);
    });
  }

  toggleAddMovieModal(){
    this.showAddMovieModal = !this.showAddMovieModal;
  }

  // ----- FILTRO -----
  filterMovies(): void {
    const query = this.searchQuery.trim().toLowerCase();
    const sanitizedQuery = query.replace(/[\.\-]/g, '');

    if (!sanitizedQuery) {
      this.displayedMovies = this.movies.slice(this.currentOffset, this.currentOffset + this.limit);
      return;
    }

    const filteredMovies = this.movies.filter(movie => {
      const title = (movie.title || '').toLowerCase();
      return title.includes(sanitizedQuery);
    });

    this.currentOffset = 0;
    this.displayedMovies = filteredMovies.slice(this.currentOffset, this.currentOffset + this.limit);
  }

  // ----- PAGINAÇÃO -----
  showNext() {
    if (this.currentOffset + this.limit < this.movies.length) {
      this.currentOffset += this.limit;
      this.displayedMovies = this.movies.slice(this.currentOffset, this.currentOffset + this.limit);
    }
  }

  showPrevious() {
    if (this.currentOffset - this.limit >= 0) {
      this.currentOffset -= this.limit;
      this.displayedMovies = this.movies.slice(this.currentOffset, this.currentOffset + this.limit);
    }
  }

// ----- HELPERS PRA EXIBIÇÃO 
getPoster(movie: any): string {
  // 1) URL que você salvou no Firestore
  if (movie.photoPath) {
    return movie.photoPath;
  }

  // 2) Se em algum lugar você salvou "poster" direto (ex: resposta da API)
  if (movie.poster) {
    return movie.poster;
  }

  // 3) fallback local
  return 'assets/imgs/comedia.jpg';
}

getTitle(movie: any): string {
  // tenta vários campos possíveis
  return movie.title || movie.name || 'Sem título';
}

getAnalysis(movie: any): string {
  // tenta no novo campo que estamos usando
  if (movie.analysis) return movie.analysis;

  // se tiver errado com "analisys" (antigo)
  if (movie.analisys) return movie.analisys;

  // se alguém tiver salvo o plot direto
  if (movie.plot) return movie.plot;

  return '';
}

deleteMovie(id: string | undefined): void {
  if (!id) {
    console.error('Filme sem id, não dá pra excluir.');
    return;
  }

  const confirmar = confirm('Tem certeza que deseja excluir este filme?');
  if (!confirmar) return;

  this.databaseService.deleteDocument('movies', id)
    .then(() => {
      console.log('Filme excluído com sucesso.');
    })
    .catch((error) => {
      console.error('Erro ao excluir filme:', error);
      alert('Erro ao excluir filme.');
    });
}

editMovie(movie: any): void {
  this.movieBeingEdited = movie;
  this.editedAnalysis = this.getAnalysis(movie); // reutiliza helper
  this.showEditModal = true;
}
saveEditedMovie(): void {
  if (!this.movieBeingEdited?.id) {
    console.error('Filme sem id, não dá pra atualizar.');
    return;
  }

  const trimmed = this.editedAnalysis.trim();
  if (!trimmed) {
    alert('A análise/plot não pode ficar vazia.');
    return;
  }

  this.databaseService
    .updateDocument('movies', this.movieBeingEdited.id, {
      analysis: trimmed   // só atualiza o campo analysis
    })
    .then(() => {
      console.log('Plot/Análise atualizada com sucesso.');
      this.closeEditModal();
    })
    .catch((error) => {
      console.error('Erro ao atualizar filme:', error);
      alert('Erro ao atualizar filme.');
    });
}

closeEditModal(): void {
  this.showEditModal = false;
  this.movieBeingEdited = null;
  this.editedAnalysis = '';
}


}