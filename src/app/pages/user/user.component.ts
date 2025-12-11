import {Component, ChangeDetectionStrategy, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog} from '@angular/material/dialog';
import {UserForm} from './user-form/user-form';
import {UserCard} from './user-card/user-card';
import {UserService} from '../../services/user-service';
import {UserRegisterDto} from '../../utils/dto/UserRegisterDto';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    CommonModule,
    UserCard,
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent implements OnInit {
  users = signal<UserRegisterDto[]>([]);
  userId: number | null = null;

  readonly dialog = inject(MatDialog);
  private userService = inject(UserService);

  loggedUser = signal<UserRegisterDto | null>(null);

  ngOnInit() {
    this.fetchLoggedUser();
    this.fetchUsers();
  }

  fetchLoggedUser() {
    if(!this.userId) {
      const email = this.getEmailFromToken();

      if (email) {
        this.userService.findByEmail(email).subscribe({
          next: (data) => {
            this.loggedUser.set(data);
            this.userId = data.id ? data.id : null;
          },
          error: (err) => console.error('Erro ao buscar usuário logado', err)
        });
      }

      return;
    }

    this.userService.findById(this.userId).subscribe({
      next: (data) => {
        this.loggedUser.set(data);
        this.userId = data.id ? data.id : null;
      },
      error: (err) => console.error('Erro ao buscar usuário por id', err)
    })
  }

  fetchUsers() {
    this.userService.findAll().subscribe({
      next: (data) => {
        this.users.set(data);
      },
      error: (err) => console.error('Erro ao listar usuários', err)
    });
  }

  private getEmailFromToken(): string | null {
    const token = localStorage.getItem('TK');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log(payload);
      return payload.sub;
    } catch (e) {
      return null;
    }
  }

  openDialog(user:UserRegisterDto | null = null) {
    const dialogRef = this.dialog.open(UserForm, {
      data: { id: user?.id, user: user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result === true) {
        this.fetchLoggedUser();
        this.fetchUsers();
      }
    })
  }
}
