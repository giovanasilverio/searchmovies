import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OmdbMovie {
  title: string;
  rating: string;
  plot: string;
  poster: string;
}

@Injectable({
  providedIn: 'root'
})
export class OmdbService {

  private baseUrl = 'http://localhost:3000/api/omdb';

  constructor(private http: HttpClient) {}

  getMovieByTitle(title: string): Observable<OmdbMovie> {
    const params = new HttpParams().set('title', title);
    return this.http.get<OmdbMovie>(this.baseUrl, { params });
  }
}
