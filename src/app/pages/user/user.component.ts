import {Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../services/user.service';
import { UserProfileDto } from '../../utils/dto/user-profile.dto';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  providers: [DatePipe],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserComponent implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  user: UserProfileDto | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.loading = true;
    this.errorMessage = '';
    // Força atualização imediata para mostrar o loading
    this.cdr.markForCheck();

    this.userService.getMyProfile().subscribe({
      next: (data) => {
        console.log('Dados recebidos:', data);
        this.user = data;
        this.loading = false;

        // 2. A MÁGICA: Avisa ao Angular para atualizar a tela AGORA
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro:', err);
        this.loading = false;

        if (err.status === 403) {
          this.errorMessage = 'Acesso negado. Tente fazer login novamente.';
        } else if (err.status === 0) {
          this.errorMessage = 'Backend indisponível ou bloqueado.';
        } else {
          this.errorMessage = 'Erro ao carregar dados.';
        }

        // Avisa ao Angular para atualizar a tela com a mensagem de erro
        this.cdr.markForCheck();
      }
    });
  }

  onEdit() {
    this.router.navigate(['/user/edit']);
  }
}
