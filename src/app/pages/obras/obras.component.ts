import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ObraControllerService } from '../../../api/api/obraController.service';
import { ObraResponseDTO } from '../../../api/model/obraResponseDTO';
import { UserService } from '../../services/user.service';
import { DiarioDeObraService } from '../../services/diario-de-obra.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-obras',
  standalone: true,
  templateUrl: './obras.component.html',
  styleUrls: ['./obras.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class ObrasComponent implements OnInit, OnDestroy {
  private obraService = inject(ObraControllerService);
  private userService = inject(UserService);
  private diarioService = inject(DiarioDeObraService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data state
  obras = signal<ObraResponseDTO[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(0);
  totalPages = signal(1);
  isGestorOrAdmin = signal<boolean>(false);

  // Filters & Search
  termoBusca = '';
  searchField = 'projeto';
  sortField = 'projeto';
  sortDir = 'asc';
  filtroAtiva = true;
  filtroConcluida = false;
  filtroCancelada = false;

  readonly pageSize = 13;

  ngOnInit(): void {
    // Check user role
    this.userService.getMyProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (profile) => {
        this.isGestorOrAdmin.set(profile.role === 'GESTOR' || profile.role === 'ADMIN');
      },
      error: (err) => console.error('Error fetching user profile', err)
    });

    // Debounce search input
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(0);
        this.loadObras();
      });

    this.loadObras();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildStatusParam(): Array<'ATIVA' | 'INATIVA' | 'CONCLUIDA'> | undefined {
    const statuses: Array<'ATIVA' | 'INATIVA' | 'CONCLUIDA'> = [];

    if (this.filtroAtiva) statuses.push('ATIVA');
    if (this.filtroConcluida) statuses.push('CONCLUIDA');
    if (this.filtroCancelada) statuses.push('INATIVA');

    // If none are checked, or all are checked, fetch all (no filter)
    if (statuses.length === 0 || statuses.length === 3) {
      return undefined;
    }

    return statuses;
  }

  loadObras(): void {
    this.loading.set(true);
    this.error.set(null);

    const statusParam = this.buildStatusParam();
    const term = this.termoBusca.trim() || undefined;

    this.obraService
      .search(this.currentPage(), this.pageSize, this.sortField, this.sortDir, this.searchField, term, statusParam)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.obras.set(page.content ?? []);
          this.totalPages.set(page.totalPages ?? 1);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(`Erro ao carregar obras: ${err.status} ${err.statusText ?? err.message}`);
          this.loading.set(false);
        },
      });
  }

  // Event Handlers
  onBuscaChange(): void {
    this.searchSubject.next(this.termoBusca);
  }

  onFiltroChange(): void {
    this.currentPage.set(0);
    this.loadObras();
  }

  onSearchFieldChange(): void {
    // If user changes search field while having a term, trigger search
    if (this.termoBusca.trim() !== '') {
      this.currentPage.set(0);
      this.loadObras();
    }
  }

  toggleSortDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortField = 'id';
    this.currentPage.set(0);
    this.loadObras();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadObras();
  }

  // Action handlers (stubs — will navigate later)
  onNovaObra(): void {
    this.router.navigate(['/obras/nova']);
  }

  onVerDiarios(obra: ObraResponseDTO): void {
    if (obra.projeto) {
      this.router.navigate(['/diarios'], { queryParams: { obra: obra.projeto } });
    }
  }

  onVisualizar(obra: ObraResponseDTO): void {
    if (obra.id) {
      this.router.navigate(['/obras/visualizar', obra.id], { state: { obra } });
    }
  }

  onEditar(obra: ObraResponseDTO): void {
    if (obra.id) {
      this.router.navigate(['/obras/editar', obra.id]);
    }
  }

  onExcluir(obra: ObraResponseDTO): void {
    if (confirm(`Deseja realmente excluir a obra "${obra.projeto}"?`)) {
      if (!obra.id) return;
      this.obraService
        .deactivate(obra.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.loadObras(),
          error: (err) =>
            alert(`Erro ao excluir obra: ${err.status} ${err.statusText}`),
        });
    }
  }

  onImprimirDiarios(obra: ObraResponseDTO): void {
    if (!obra.id) return;
    this.snackBar.open(`Gerando PDF dos diários da obra "${obra.projeto}"...`, '', { duration: 3000 });
    this.diarioService.imprimirDiariosObra(obra.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `diarios_obra_${obra.id}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          if (err.status === 400 || err.status === 403) {
             this.snackBar.open('A obra não possui diários para impressão ou você não tem permissão.', 'Fechar', { duration: 4000 });
          } else {
             this.snackBar.open('Erro ao gerar PDF dos diários.', 'Fechar', { duration: 3000 });
          }
        }
      });
  }

  // Helpers
  getStatusLabel(status?: ObraResponseDTO.StatusEnum | string): string {
    switch (status) {
      case 'ATIVA': return 'Em andamento';
      case 'INATIVA': return 'Cancelada'; // The UI shows Cancelada
      case 'CONCLUIDA': return 'Concluída';
      default: return status ?? '—';
    }
  }

  getStatusClass(status?: ObraResponseDTO.StatusEnum | string): string {
    switch (status) {
      case 'ATIVA': return 'badge-ativa';
      case 'INATIVA': return 'badge-inativa';
      case 'CONCLUIDA': return 'badge-concluida';
      default: return '';
    }
  }

  formatDate(dateStr?: string | any): string {
    if (!dateStr) return '—';

    // Fallback if backend (Spring/Jackson) returns an array like [yyyy, MM, dd]
    if (Array.isArray(dateStr) && dateStr.length >= 3) {
      const [year, month, day] = dateStr;
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }

    try {
      let parsedDate = dateStr;
      // Prevent timezone shifting bug for 'YYYY-MM-DD' strings
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
        parsedDate = `${dateStr.trim()}T12:00:00`;
      }

      const d = new Date(parsedDate);
      // Valid date check
      if (isNaN(d.getTime())) {
        return typeof dateStr === 'string' ? dateStr : '—';
      }

      return d.toLocaleDateString('pt-BR');
    } catch {
      return typeof dateStr === 'string' ? dateStr : '—';
    }
  }
}
