import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { UserProfileDto } from '../../utils/dto/user-profile.dto';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RouterModule,
    FormsModule
  ],
  providers: [DatePipe],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  users: UserProfileDto[] = [];
  loading = true;

  // Paginação
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  // Filtros
  searchTerm: string = '';
  roleFilter: string = '';
  hideInactive: boolean = true;
  sortField: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  private searchTimeout: any;

  ngOnInit(): void {
    this.users = [];
    this.loadData();
  }

  //  GETTERS PARA O TEXTO DO RODAPÉ

  // Calcula o primeiro item (ex: item 11 na página 2)
  get startRange(): number {
    if (this.totalElements === 0) return 0;
    return (this.page * this.size) + 1;
  }

  // Calcula o último item (ex: item 20 na página 2, ou o total se for a última)
  get endRange(): number {
    return Math.min((this.page + 1) * this.size, this.totalElements);
  }

  //

  loadData() {
    this.loading = true;
    this.cdr.detectChanges();

    this.userService.searchUsers(
      this.page,
      this.size,
      this.sortField,
      this.sortDirection,
      this.searchTerm,
      this.roleFilter,
      this.hideInactive
    ).subscribe({
      next: (pageData) => {
        this.users = pageData.content;
        this.totalElements = pageData.totalElements;
        this.totalPages = pageData.totalPages;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erro ao carregar lista.', 'Fechar', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange() {
    this.page = 0;
    this.loadData();
  }

  onSearchInput() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 0;
      this.loadData();
    }, 500);
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.loadData();
  }

  //  NAVEGAÇÃO PAGINAÇÃO

  firstPage() {
    if (this.page !== 0) {
      this.page = 0;
      this.loadData();
    }
  }

  lastPage() {
    if (this.page < this.totalPages - 1) {
      this.page = this.totalPages - 1;
      this.loadData();
    }
  }

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadData();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadData();
    }
  }

  onAddUser() {
    this.router.navigate(['/user/new']);
  }

  onToggleStatus(user: UserProfileDto) {
    const action = user.enabled ? 'desativar' : 'ativar';
    if (!confirm(`Deseja realmente ${action} o usuário ${user.name}?`)) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.snackBar.open(`Status alterado com sucesso.`, 'Ok', { duration: 3000 });
        this.loadData();
      },
      error: () => {
        this.snackBar.open('Erro ao alterar status.', 'Fechar', { duration: 3000 });
      }
    });
  }

  getRoleClass(role?: string): string {
    const r = role?.toUpperCase() || '';
    switch (r) {
      case 'ADMIN': return 'role-admin';
      case 'GESTOR': return 'role-gestor';
      case 'ENGENHEIRO': return 'role-engenheiro';
      case 'FISCAL': return 'role-fiscal';
      default: return '';
    }
  }
}
