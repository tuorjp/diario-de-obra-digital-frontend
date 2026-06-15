import {Component, ChangeDetectionStrategy, OnInit, inject, ChangeDetectorRef} from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import {UserProfileDto} from '../../../utils/dto/user-profile.dto';
import {UserService} from '../../../services/user.service';
import {AuthService} from '../../../core/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentUser: UserProfileDto | null = null;

  ngOnInit() {
    this.userService.getMyProfile().subscribe({
      // ADICIONADO A TIPAGEM : UserProfileDto
      next: (user: UserProfileDto) => {
        this.currentUser = user;
        this.cdr.markForCheck();
      },
      error: () => {
        console.warn('Não foi possível carregar perfil na sidebar');
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
