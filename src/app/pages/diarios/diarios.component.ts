import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DiarioDeObraService } from '../../services/diario-de-obra.service';
import { AuthService } from '../../core/auth/auth.service';
import { DiarioResponseDto } from '../../utils/dto/diario.dto';

@Component({
  selector: 'app-diarios',
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
  templateUrl: './diarios.component.html',
  styleUrls: ['./diarios.component.scss']
})
export class DiariosComponent implements OnInit {
  private diarioService = inject(DiarioDeObraService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  diarios: DiarioResponseDto[] = [];
  loading = true;

  // Pagination
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  // Filters
  filterObra?: string;
  filterData?: string;
  filterAutor?: string;

  userRole: string | null = null;
  userId: number | null = null;

  activeDropdownId: number | null = null;

  @HostListener('document:click')
  closeDropdown() {
    this.activeDropdownId = null;
  }

  toggleDropdown(id: number, event: Event) {
    event.stopPropagation();
    this.activeDropdownId = this.activeDropdownId === id ? null : id;
  }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.userId = this.authService.getUserId();

    // Check for query parameters
    const obraParam = this.route.snapshot.queryParamMap.get('obra');
    if (obraParam) {
      this.filterObra = obraParam;
    }

    this.loadData();
  }

  get startRange(): number {
    if (this.totalElements === 0) return 0;
    return (this.page * this.size) + 1;
  }

  get endRange(): number {
    return Math.min((this.page + 1) * this.size, this.totalElements);
  }

  loadData() {
    this.loading = true;
    this.cdr.detectChanges();

    this.diarioService.searchDiarios(
      this.page,
      this.size,
      this.filterObra,
      this.filterData,
      this.filterAutor
    ).subscribe({
      next: (pageData) => {
        this.diarios = pageData.content;
        this.totalElements = pageData.totalElements;
        this.totalPages = pageData.totalPages;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erro ao carregar diários.', 'Fechar', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange() {
    this.page = 0;
    this.loadData();
  }

  clearFilters() {
    this.filterObra = undefined;
    this.filterData = undefined;
    this.filterAutor = undefined;
    this.page = 0;
    this.loadData();
  }

  // Pagination actions
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

  onAddDiario() {
    this.router.navigate(['/diarios/new']);
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'VALIDO': return 'Válido';
      case 'INVALIDO': return 'Inválido';
      case 'AGUARDANDO_AVALIACAO': return 'Aguardando Avaliação';
      default: return status;
    }
  }

  // Role Checks
  canDelete(diario: DiarioResponseDto): boolean {
    return this.userRole === 'ADMIN';
  }

  canApproveReject(diario: DiarioResponseDto): boolean {
    if (diario.status !== 'AGUARDANDO_AVALIACAO') return false;
    return ['ADMIN', 'GESTOR', 'FISCAL'].includes(this.userRole || '');
  }

  canEdit(diario: DiarioResponseDto): boolean {
    if (this.userRole === 'ADMIN') return true;
    if (['ENGENHEIRO', 'GESTOR'].includes(this.userRole || '')) {
      if (diario.autorId !== this.userId) return false;
      const diarioDate = new Date(diario.data);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - diarioDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 5;
    }
    return false;
  }

  onDelete(diario: DiarioResponseDto) {
    if (!confirm(`Deseja realmente excluir o diário do dia ${diario.data}?`)) return;

    this.diarioService.deleteDiario(diario.id).subscribe({
      next: () => {
        this.snackBar.open(`Diário excluído com sucesso.`, 'Ok', { duration: 3000 });
        this.loadData();
      },
      error: () => {
        this.snackBar.open('Erro ao excluir diário.', 'Fechar', { duration: 3000 });
      }
    });
  }

  onAprovar(diario: DiarioResponseDto) {
    if (!confirm('Deseja aprovar este diário?')) return;
    this.diarioService.aprovarDiario(diario.id).subscribe({
      next: () => {
        this.snackBar.open('Diário aprovado.', 'Ok', { duration: 3000 });
        this.loadData();
      },
      error: () => this.snackBar.open('Erro ao aprovar diário.', 'Fechar', { duration: 3000 })
    });
  }

  onReprovar(diario: DiarioResponseDto) {
    const comentario = prompt('Motivo da reprovação (opcional):');
    if (comentario === null) return; // Cancelled
    this.diarioService.reprovarDiario(diario.id, comentario).subscribe({
      next: () => {
        this.snackBar.open('Diário reprovado.', 'Ok', { duration: 3000 });
        this.loadData();
      },
      error: () => this.snackBar.open('Erro ao reprovar diário.', 'Fechar', { duration: 3000 })
    });
  }
}
