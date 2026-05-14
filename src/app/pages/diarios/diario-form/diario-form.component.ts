import { Component, OnInit, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DiarioDeObraService } from '../../../services/diario-de-obra.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ObraModalComponent } from './obra-modal/obra-modal.component';
import { ObraResponseDTO } from '../../../../api/model/obraResponseDTO';
import { CreateOcorrenciaDto, MaoDeObraItemDto, ServicoItemDto, EquipamentoItemDto, DiarioResponseDto } from '../../../utils/dto/diario.dto';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { extractErrorMessage } from '../../../utils/extract-error-message';
import { CatalogSelectDialogComponent, CatalogSelectedItem, CatalogSelectDialogData } from '../../../dialogs/catalog-select-dialog/catalog-select-dialog.component';

@Component({
  selector: 'app-diario-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, ObraModalComponent, MatAutocompleteModule, MatInputModule, MatFormFieldModule],
  templateUrl: './diario-form.component.html',
  styleUrls: ['./diario-form.component.scss'],
  providers: [DatePipe]
})
export class DiarioFormComponent implements OnInit {
  private diarioService = inject(DiarioDeObraService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  @ViewChild('obraModal') obraModal!: ObraModalComponent;
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state && nav.extras.state['obra']) {
      this.obraSelecionada = nav.extras.state['obra'];
    }
  }

  isEditMode = false;
  isViewMode = false;
  diarioId!: number;
  diarioCompleto: DiarioResponseDto | null = null;
  activeTab: 'DIARIO' | 'OCORRENCIAS' = 'DIARIO';
  errorMsg: string | null = null;

  // Catalogs
  catalogoEquipamentos: any[] = [];
  catalogoMaoDeObra: any[] = [];
  catalogoServicos: any[] = [];

  // Form Data
  obraSelecionada: ObraResponseDTO | null = null;
  dataDiario: string = '';
  today: string = '';
  condicaoClimatica: string = 'ENSOLARADO';
  observacoes: string = '';

  equipamentosAdicionados: EquipamentoItemDto[] = [];
  maoDeObraAdicionada: MaoDeObraItemDto[] = [];
  servicosAdicionados: ServicoItemDto[] = [];
  ocorrenciasAdicionadas: CreateOcorrenciaDto[] = [];

  buscaEquipamento: string = '';
  buscaMaoDeObra: string = '';
  buscaServico: string = '';

  tempOcorrenciaTipo: string = '';
  tempOcorrenciaDescricao: string = '';

  fotosNovas: File[] = [];
  fotosExistentes: string[] = []; // URLs from API
  
  carouselCurrentIndex = 0;

  ngOnInit(): void {
    const now = new Date();
    this.today = this.datePipe.transform(now, 'yyyy-MM-dd') || '';
    this.dataDiario = this.today;
    
    this.carregarCatalogos();

    const idParam = this.route.snapshot.paramMap.get('id');
    const isView = this.route.snapshot.url.some(segment => segment.path === 'view');
    
    if (idParam) {
      this.isEditMode = !isView;
      this.isViewMode = isView;
      this.diarioId = +idParam;
      this.carregarDiario(this.diarioId);
    }
  }

  carregarCatalogos() {
    this.diarioService.getEquipamentos().subscribe(data => this.catalogoEquipamentos = data);
    this.diarioService.getMaoDeObra().subscribe(data => this.catalogoMaoDeObra = data);
    this.diarioService.getServicos().subscribe(data => this.catalogoServicos = data);
  }

  carregarDiario(id: number) {
    this.diarioService.getDiario(id).subscribe({
      next: (diario) => {
        this.diarioCompleto = diario;
        this.obraSelecionada = { id: diario.obraId, projeto: diario.projeto } as ObraResponseDTO;
        // The API returns an array for localdate sometimes [yyyy, mm, dd] or string
        if (Array.isArray(diario.data)) {
          const [y, m, d] = diario.data;
          this.dataDiario = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        } else if (diario.data && typeof diario.data === 'string') {
          this.dataDiario = diario.data.split('T')[0];
        }

        this.condicaoClimatica = diario.condicaoClimatica;
        this.observacoes = diario.observacoes || '';
        
        this.maoDeObraAdicionada = (diario.maoDeObra || []).map(mo => ({
          maoDeObraId: mo.maoDeObraId,
          maoDeObraNome: (mo as any).nome,
          quantidade: mo.quantidade
        }));
        
        this.equipamentosAdicionados = (diario.equipamentos || []).map(eq => ({
          equipamentoId: eq.equipamentoId,
          equipamentoNome: (eq as any).nome,
          quantidade: eq.quantidade
        }));
        
        this.servicosAdicionados = (diario.servicos || []).map(sv => ({
          servicoId: sv.servicoId,
          servicoNome: (sv as any).nome,
          quantidade: (sv as any).quantidade || 1
        }));
        
        this.ocorrenciasAdicionadas = (diario.ocorrencias || []).map(o => ({
           tipo: o.tipo,
           ocorrencia: o.ocorrencia
        }));

        const fetchPromises = (diario.fotos || []).map(async (filename: string) => {
          const url = this.getPhotoUrl(filename);
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type });
          } catch (e) {
            console.error('Erro ao baixar foto existente', filename, e);
            return null;
          }
        });
        
        Promise.all(fetchPromises).then(files => {
          const validFiles = files.filter(f => f !== null) as File[];
          this.fotosNovas.push(...validFiles);
          this.cdr.detectChanges();
        });
      },
      error: async (err) => {
        this.errorMsg = await extractErrorMessage(err, 'Erro ao carregar diário.');
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'DIARIO' | 'OCORRENCIAS') {
    this.activeTab = tab;
  }

  openObraModal() {
    this.obraModal.open();
  }

  onObraSelected(obra: ObraResponseDTO) {
    this.obraSelecionada = obra;
  }

  openCatalogDialog(type: 'equipamento' | 'maoDeObra' | 'servico'): void {
    const configs: Record<string, { title: string; catalog: any[]; selected: CatalogSelectedItem[]; step?: number }> = {
      equipamento: {
        title: 'Selecionar Equipamentos',
        catalog: this.catalogoEquipamentos,
        selected: this.equipamentosAdicionados.map(e => ({ id: e.equipamentoId, nome: e.equipamentoNome ?? '', quantidade: e.quantidade }))
      },
      maoDeObra: {
        title: 'Selecionar Mão de Obra',
        catalog: this.catalogoMaoDeObra,
        selected: this.maoDeObraAdicionada.map(m => ({ id: m.maoDeObraId, nome: m.maoDeObraNome ?? '', quantidade: m.quantidade }))
      },
      servico: {
        title: 'Selecionar Serviços Executados',
        catalog: this.catalogoServicos,
        selected: this.servicosAdicionados.map(s => ({ id: s.servicoId, nome: s.servicoNome ?? '', quantidade: s.quantidade })),
        step: 0.5
      }
    };

    const cfg = configs[type];
    const data: CatalogSelectDialogData = {
      title: cfg.title,
      catalog: cfg.catalog,
      selected: cfg.selected,
      quantityStep: cfg.step ?? 1
    };

    const ref = this.dialog.open(CatalogSelectDialogComponent, {
      data,
      panelClass: 'catalog-select-panel',
      maxWidth: '560px',
      width: '90vw',
      disableClose: true
    });

    ref.afterClosed().subscribe((result: CatalogSelectedItem[] | null) => {
      if (result === null) return; // cancelled

      if (type === 'equipamento') {
        this.equipamentosAdicionados = result.map(r => ({
          equipamentoId: r.id,
          equipamentoNome: r.nome,
          quantidade: r.quantidade
        }));
      } else if (type === 'maoDeObra') {
        this.maoDeObraAdicionada = result.map(r => ({
          maoDeObraId: r.id,
          maoDeObraNome: r.nome,
          quantidade: r.quantidade
        }));
      } else {
        this.servicosAdicionados = result.map(r => ({
          servicoId: r.id,
          servicoNome: r.nome,
          quantidade: r.quantidade
        }));
      }
      setTimeout(() => this.cdr.detectChanges());
    });
  }

  // --- Legacy autocomplete (kept for removal safety) ---

  removeEquipamento(index: number) {
    this.equipamentosAdicionados.splice(index, 1);
  }

  removeMaoDeObra(index: number) {
    this.maoDeObraAdicionada.splice(index, 1);
  }

  removeServico(index: number) {
    this.servicosAdicionados.splice(index, 1);
  }

  addOcorrencia() {
    if (this.tempOcorrenciaTipo && this.tempOcorrenciaDescricao) {
      this.ocorrenciasAdicionadas.push({
        tipo: this.tempOcorrenciaTipo,
        ocorrencia: this.tempOcorrenciaDescricao
      });
      this.tempOcorrenciaTipo = '';
      this.tempOcorrenciaDescricao = '';
    }
  }

  removeOcorrencia(index: number) {
    this.ocorrenciasAdicionadas.splice(index, 1);
  }

  // --- Photo Upload ---
  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
        this.fotosNovas.push(files[i]);
    }
  }

  removeFotoNova(index: number) {
    this.fotosNovas.splice(index, 1);
    if (this.carouselCurrentIndex >= this.fotosNovas.length) {
      this.carouselCurrentIndex = Math.max(0, this.fotosNovas.length - 1);
    }
  }

  onDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
        this.fotosNovas.push(files[i]);
    }
  }

  // Carousel functions
  nextPhoto() {
    if (this.fotosNovas.length > 0) {
      this.carouselCurrentIndex = (this.carouselCurrentIndex + 1) % this.fotosNovas.length;
    }
  }

  prevPhoto() {
    if (this.fotosNovas.length > 0) {
      this.carouselCurrentIndex = (this.carouselCurrentIndex - 1 + this.fotosNovas.length) % this.fotosNovas.length;
    }
  }

  getFileUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  getPhotoUrl(filename: string): string {
    return `http://localhost:8090/diario/fotos/${filename}`;
  }

  salvar() {
    this.errorMsg = null;
    if (!this.obraSelecionada || !this.dataDiario || !this.condicaoClimatica) {
      this.errorMsg = 'Preencha os campos obrigatórios: Obra, Data e Condição Climática.';
      return;
    }

    // Só bloqueia data no passado ao criar um novo diário.
    // Em modo edição, o backend controla a janela de 5 dias.
    if (!this.isEditMode && this.dataDiario < this.today) {
      this.errorMsg = 'A data do diário não pode ser no passado.';
      return;
    }

    const baseDto = {
      data: this.dataDiario,
      condicaoClimatica: this.condicaoClimatica,
      observacoes: this.observacoes,
      maoDeObra: this.maoDeObraAdicionada,
      servicos: this.servicosAdicionados,
      equipamentos: this.equipamentosAdicionados,
      ocorrencias: this.ocorrenciasAdicionadas
    };

    const diarioBlob = new Blob([JSON.stringify(this.isEditMode ? baseDto : { ...baseDto, obraId: this.obraSelecionada.id })], { type: 'application/json' });

    if (this.isEditMode) {
      this.diarioService.updateDiario(this.diarioId, diarioBlob, this.fotosNovas).subscribe({
        next: () => {
          this.snackBar.open('Diário atualizado com sucesso!', 'OK', { duration: 3000 });
          this.router.navigate(['/diarios']);
        },
        error: async (err) => {
          this.errorMsg = await extractErrorMessage(err, 'Erro ao atualizar diário. Tente novamente.');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.diarioService.createDiario(this.obraSelecionada.id!, diarioBlob, this.fotosNovas).subscribe({
        next: () => {
          this.snackBar.open('Diário criado com sucesso!', 'OK', { duration: 3000});
          this.router.navigate(['/diarios']);
        },
        error: async (err) => {
          this.errorMsg = await extractErrorMessage(err, 'Erro ao criar diário. Tente novamente.');
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelar() {
    this.router.navigate(['/diarios']);
  }

  canApproveReject(): boolean {
    if (!this.diarioCompleto || this.diarioCompleto.status !== 'AGUARDANDO_AVALIACAO') return false;
    const role = this.authService.getUserRole();
    return ['ADMIN', 'GESTOR', 'FISCAL'].includes(role || '');
  }

  onAprovar() {
    if (!confirm('Deseja aprovar este diário?')) return;
    this.diarioService.aprovarDiario(this.diarioId).subscribe({
      next: () => {
        this.snackBar.open('Diário aprovado com sucesso!', 'OK', { duration: 3000 });
        this.router.navigate(['/diarios']);
      },
      error: async (err) => {
        this.errorMsg = await extractErrorMessage(err, 'Erro ao aprovar diário.');
        this.cdr.detectChanges();
      }
    });
  }

  onReprovar() {
    const comentario = prompt('Motivo da reprovação (opcional):');
    if (comentario === null) return;
    this.diarioService.reprovarDiario(this.diarioId, comentario).subscribe({
      next: () => {
        this.snackBar.open('Diário reprovado com sucesso!', 'OK', { duration: 3000 });
        this.router.navigate(['/diarios']);
      },
      error: async (err) => {
        this.errorMsg = await extractErrorMessage(err, 'Erro ao reprovar diário.');
        this.cdr.detectChanges();
      }
    });
  }
}
