import { Component, OnInit } from '@angular/core';
import { UsersService } from './services/users.service';
import { LoadingService } from './services/loading.service';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  map,
  startWith,
  catchError,
  of,
} from 'rxjs';
import { ApiResponse } from './interfaces/api-response';
import { Page } from './interfaces/page';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  usersState$: Observable<{
    appState: string;
    appData?: ApiResponse<Page>;
    error?: HttpErrorResponse;
  }>;
  responseSubject = new BehaviorSubject<ApiResponse<Page>>(null);
  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();
  constructor(
    private userService: UsersService,
    public loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingService.loadingOn();
    this.usersState$ = this.userService.users$().pipe(
      map((response: ApiResponse<Page>) => {
        this.loadingService.loadingOff();
        this.responseSubject.next(response);
        this.currentPageSubject.next(response.data.page.number);
        console.log(response);
        return { appState: 'APP_LOADED', appData: response };
      }),
      startWith({ appState: 'APP_LOADING' }),
      catchError((error: HttpErrorResponse) => {
        this.loadingService.loadingOff();
        return of({ appState: 'APP_ERROR', error });
      })
    );
  }

  gotToPage(name?: string, pageNumber: number = 0): void {
    this.loadingService.loadingOn();
    this.usersState$ = this.userService.users$(name, pageNumber).pipe(
      map((response: ApiResponse<Page>) => {
        this.loadingService.loadingOff();
        this.responseSubject.next(response);
        this.currentPageSubject.next(pageNumber);
        console.log(response);
        return { appState: 'APP_LOADED', appData: response };
      }),
      startWith({
        appState: 'APP_LOADED',
        appData: this.responseSubject.value,
      }),
      catchError((error: HttpErrorResponse) => {
        this.loadingService.loadingOff();
        return of({ appState: 'APP_ERROR', error });
      })
    );
  }

  goToNextOrPreviousPage(direction?: string, name?: string): void {
    this.gotToPage(
      name,
      direction === 'forward'
        ? this.currentPageSubject.value + 1
        : this.currentPageSubject.value - 1
    );
  }
}
