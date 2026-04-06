// @refresh
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ObraControllerService } from '../../../../api/api/obraController.service';
import { ObraResponseDTO } from '../../../../api/model/obraResponseDTO';
import { UserProfileDTO } from '../../../../api/model/userProfileDTO';
import { UserService } from '../../../services/user.service';
import { DiarioDeObraService } from '../../../services/diario-de-obra.service';
import { DiarioResponseDto } from '../../../utils/dto/diario.dto';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-obra-visualizar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './obra-visualizar.component.html',
    styleUrls: ['./obra-visualizar.component.scss']
})
export class ObraVisualizarComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private obraService = inject(ObraControllerService);
    private userService = inject(UserService);
    private diarioService = inject(DiarioDeObraService);
    private authService = inject(AuthService);
    private destroy$ = new Subject<void>();

    private userRole: string | null = null;
    private userId: number | null = null;

    obra = signal<ObraResponseDTO | null>(null);
    loading = signal<boolean>(true);
    error = signal<string | null>(null);
    isGestorOrAdmin = signal<boolean>(false);

    // Diários reais do backend
    diarios = signal<DiarioResponseDto[]>([]);
    diariosLoading = signal<boolean>(false);
    diariosError = signal<string | null>(null);

    // Paginação dos diários
    diarioPage = signal<number>(0);
    diarioSize = 10;
    diarioTotalPages = signal<number>(0);
    diarioTotalElements = signal<number>(0);

    constructor() {
        const nav = this.router.getCurrentNavigation();
        if (nav?.extras.state && nav.extras.state['obra']) {
            // Use router state for immediate display, but always refresh from API
            this.obra.set(nav.extras.state['obra']);
        }
    }

    ngOnInit(): void {
        this.userRole = this.authService.getUserRole();
        this.userId = this.authService.getUserId();

        this.userService.getMyProfile().pipe(takeUntil(this.destroy$)).subscribe({
            next: (profile) => {
                this.isGestorOrAdmin.set(profile.role === 'GESTOR' || profile.role === 'ADMIN');
            },
            error: (err) => console.error('Error fetching user profile', err)
        });

        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const idStr = params.get('id');
            if (idStr) {
                const id = parseInt(idStr, 10);
                if (!isNaN(id)) {
                    // Always load from backend to get complete data (e.g. observacao)
                    this.loadObra(id);
                } else {
                    this.error.set('ID de obra inválido.');
                    this.loading.set(false);
                }
            } else {
                this.error.set('ID de obra não fornecido.');
                this.loading.set(false);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadObra(id: number): void {
        this.loading.set(true);
        this.error.set(null);
        this.obraService.findById(id).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data: any) => {
                const parsedData = (data && data.data) ? data.data : data;
                this.obra.set(parsedData);
                this.loading.set(false);
                this.loadDiarios(id);
            },
            error: (err) => {
                this.error.set(`Erro ao carregar os detalhes da obra: ${err.status} ${err.statusText}`);
                this.loading.set(false);
            }
        });
    }

    loadDiarios(obraId: number, page: number = 0): void {
        this.diariosLoading.set(true);
        this.diariosError.set(null);
        this.diarioService.searchDiariosByObraId(obraId, page, this.diarioSize)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (pageData) => {
                    this.diarios.set(pageData.content);
                    this.diarioTotalPages.set(pageData.totalPages);
                    this.diarioTotalElements.set(pageData.totalElements);
                    this.diarioPage.set(pageData.number ?? page);
                    this.diariosLoading.set(false);
                },
                error: (err) => {
                    this.diariosError.set('Erro ao carregar os diários desta obra.');
                    this.diariosLoading.set(false);
                }
            });
    }

    goBack(): void {
        this.location.back();
    }

    goHome(): void {
        this.router.navigate(['/']);
    }

    goObras(): void {
        this.router.navigate(['/obras']);
    }

    onInserirDiario(): void {
        const o = this.obra();
        if (o) {
            this.router.navigate(['/diarios/new'], { state: { obra: o } });
        } else {
            this.router.navigate(['/diarios/new']);
        }
    }

    onEditarObra(): void {
        const o = this.obra();
        if (o?.id) {
            this.router.navigate(['/obras/editar', o.id]);
        }
    }

    getEngenheirosList(): UserProfileDTO[] {
        const obj = this.obra();
        if (!obj || !obj.engenheiros) return [];
        return Array.from(obj.engenheiros);
    }

    // ---- Ações de diário ----
    onVisualizarDiario(diario: DiarioResponseDto): void {
        this.router.navigate(['/diarios/edit', diario.id]);
    }

    onEditarDiario(diario: DiarioResponseDto): void {
        this.router.navigate(['/diarios/edit', diario.id]);
    }

    onExcluirDiario(diario: DiarioResponseDto): void {
        const confirmado = confirm(`Deseja realmente excluir o diário do dia ${this.formatDate(diario.data)}?`);
        if (!confirmado) return;

        this.diarioService.deleteDiario(diario.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    const obraId = this.obra()?.id;
                    if (obraId) {
                        // Volta para página atual de diários após exclusão
                        const currentPage = this.diarioPage();
                        const isLastItem = this.diarios().length === 1 && currentPage > 0;
                        this.loadDiarios(obraId, isLastItem ? currentPage - 1 : currentPage);
                    }
                },
                error: (err) => {
                    alert('Erro ao excluir o diário. Tente novamente.');
                }
            });
    }

    // Controle de permissões
    canEditDiario(diario: DiarioResponseDto): boolean {
        if (this.userRole === 'ADMIN') return true;
        if (['ENGENHEIRO', 'GESTOR'].includes(this.userRole || '')) {
            if (diario.autorId !== this.userId) return false;
            const diarioDate = new Date(diario.data);
            const today = new Date();
            const diffDays = Math.ceil(Math.abs(today.getTime() - diarioDate.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays <= 5;
        }
        return false;
    }

    canDeleteDiario(diario: DiarioResponseDto): boolean {
        return this.userRole === 'ADMIN';
    }

    // Paginação dos diários
    diarioNextPage(): void {
        const obraId = this.obra()?.id;
        if (!obraId) return;
        const currentPage = this.diarioPage();
        if (currentPage < this.diarioTotalPages() - 1) {
            this.loadDiarios(obraId, currentPage + 1);
        }
    }

    diarioPrevPage(): void {
        const obraId = this.obra()?.id;
        if (!obraId) return;
        const currentPage = this.diarioPage();
        if (currentPage > 0) {
            this.loadDiarios(obraId, currentPage - 1);
        }
    }

    getDiarioStatusLabel(status: string): string {
        switch (status) {
            case 'VALIDO': return 'Válido';
            case 'INVALIDO': return 'Inválido';
            case 'AGUARDANDO_AVALIACAO': return 'Pendente';
            default: return status ?? '—';
        }
    }

    getDiarioStatusClass(status: string): string {
        switch (status) {
            case 'VALIDO': return 'status-valido';
            case 'INVALIDO': return 'status-invalido';
            case 'AGUARDANDO_AVALIACAO': return 'status-pendente';
            default: return '';
        }
    }

    formatDate(dateStr?: string | any): string {
        if (!dateStr) return '—';

        if (Array.isArray(dateStr) && dateStr.length >= 3) {
            const [year, month, day] = dateStr;
            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        }

        try {
            let parsedDate = dateStr;
            if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
                parsedDate = `${dateStr.trim()}T12:00:00`;
            }
            const d = new Date(parsedDate);
            if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '—';
            return d.toLocaleDateString('pt-BR');
        } catch {
            return typeof dateStr === 'string' ? dateStr : '—';
        }
    }

    getStatusLabel(status?: string): string {
        switch (status) {
            case 'ATIVA': return 'Em andamento';
            case 'INATIVA': return 'Inativa';
            default: return status ?? '—';
        }
    }
}
