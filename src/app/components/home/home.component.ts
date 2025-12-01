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

  // ----- HELPERS PRA EXIBIÇÃO (se quiser tratar fallback) -----
  getPoster(movie: any): string {
    return movie.photoPath || '../../../assets/imgs/comedia.jpg';
  }

  getTitle(movie: any): string {
    return movie.title || 'Sem título';
  }

  getAnalysis(movie: any): string {
    return movie.analysis || '';
  }

  getRating(movie: any): number {
    return movie.rating ?? 0;
  }
}
