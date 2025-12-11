import {Component, ChangeDetectionStrategy, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {UserForm} from './user-form/user-form';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    MatButtonModule,
    CommonModule,
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  users = [
    { id: 1, usuario: 'admin@gmail.com', nome: 'Administrador', perfil: 'ADMIN', status: 'Ativo' },
    { id: 2, usuario: 'jose@gmail.com', nome: 'José', perfil: 'FISCAL', status: 'Ativo' },
    { id: 3, usuario: 'jp@gmail.com', nome: 'Engenheiro', perfil: 'ADMIN', status: 'Ativo' },
  ];

  readonly dialog = inject(MatDialog);

  openDialog(id:number | null = null) {
    const dialogRef = this.dialog.open(UserForm, {
      data: { id: id }
    });
  }
}
