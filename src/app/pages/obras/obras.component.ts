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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ObraControllerService } from '../../../api/api/obraController.service';
import { ObraResponseDTO } from '../../../api/model/obraResponseDTO';

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
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<void>();

  // Data state
  obras = signal<ObraResponseDTO[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(0);
  totalPages = signal(1);

  // Filters & Search
  termoBusca = '';
  sortField = 'projeto';
  sortDir = 'asc';
  filtroAtiva = true;
  filtroConcluida = false;
  filtroCancelada = false;

  readonly pageSize = 13;

  ngOnInit(): void {
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

  private buildStatusParam(): 'ATIVA' | 'INATIVA' | undefined {
    // For now map the main filter: if only "Em andamento" checked → ATIVA
    if (this.filtroAtiva && !this.filtroConcluida && !this.filtroCancelada) {
      return 'ATIVA';
    }
    if (!this.filtroAtiva && (this.filtroConcluida || this.filtroCancelada)) {
      return 'INATIVA';
    }
    return undefined; // all or no filter
  }

  loadObras(): void {
    this.loading.set(true);
    this.error.set(null);

    const statusParam = this.buildStatusParam();
    const term = this.termoBusca.trim() || undefined;

    this.obraService
      .search(this.currentPage(), this.pageSize, this.sortField, this.sortDir, term, statusParam)
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
    this.searchSubject.next();
  }

  onSortChange(): void {
    this.currentPage.set(0);
    this.loadObras();
  }

  onFiltroChange(): void {
    this.currentPage.set(0);
    this.loadObras();
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
    console.log('[ObrasComponent] Nova obra clicked');
  }

  onVerDiarios(obra: ObraResponseDTO): void {
    console.log('[ObrasComponent] Ver diários:', obra.id);
  }

  onVisualizar(obra: ObraResponseDTO): void {
    console.log('[ObrasComponent] Visualizar:', obra.id);
  }

  onEditar(obra: ObraResponseDTO): void {
    console.log('[ObrasComponent] Editar:', obra.id);
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

  // Helpers
  getStatusLabel(status?: ObraResponseDTO.StatusEnum | string): string {
    switch (status) {
      case 'ATIVA': return 'Em andamento';
      case 'INATIVA': return 'Inativa';
      default: return status ?? '—';
    }
  }

  getStatusClass(status?: ObraResponseDTO.StatusEnum | string): string {
    switch (status) {
      case 'ATIVA': return 'badge-ativa';
      case 'INATIVA': return 'badge-inativa';
      default: return '';
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  }
}
