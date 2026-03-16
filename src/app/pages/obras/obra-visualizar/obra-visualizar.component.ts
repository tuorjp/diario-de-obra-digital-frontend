import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ObraControllerService } from '../../../../api/api/obraController.service';
import { ObraResponseDTO } from '../../../../api/model/obraResponseDTO';
import { UserProfileDTO } from '../../../../api/model/userProfileDTO';
import { UserService } from '../../../services/user.service';

interface DiarioMock {
    data: string;
    engenheiro: string;
    crea: string;
    status: 'Pendente' | 'Validado';
}

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
    private destroy$ = new Subject<void>();

    obra = signal<ObraResponseDTO | null>(null);
    loading = signal<boolean>(true);
    error = signal<string | null>(null);
    isGestorOrAdmin = signal<boolean>(false);

    diariosMock = signal<DiarioMock[]>([
        { data: '21/08/2025', engenheiro: 'Juliana Evelyn Clarice Pires', crea: '5168415 - GO', status: 'Pendente' },
        { data: '20/08/2025', engenheiro: 'Juliana Evelyn Clarice Pires', crea: '5168415 - GO', status: 'Validado' },
        { data: '19/08/2025', engenheiro: 'Juliana Evelyn Clarice Pires', crea: '5168415 - GO', status: 'Validado' },
        { data: '18/08/2025', engenheiro: 'Juliana Evelyn Clarice Pires', crea: '5168415 - GO', status: 'Validado' },
        { data: '17/08/2025', engenheiro: 'Juliana Evelyn Clarice Pires', crea: '5168415 - GO', status: 'Validado' },
    ]);

    constructor() {
        const nav = this.router.getCurrentNavigation();
        if (nav?.extras.state && nav.extras.state['obra']) {
            // Use router state for immediate display, but always refresh from API
            this.obra.set(nav.extras.state['obra']);
        }
    }

    ngOnInit(): void {
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
            },
            error: (err) => {
                this.error.set(`Erro ao carregar os detalhes da obra: ${err.status} ${err.statusText}`);
                this.loading.set(false);
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
