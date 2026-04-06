import { Component, OnInit, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DiarioDeObraService } from '../../../services/diario-de-obra.service';
import { ObraModalComponent } from './obra-modal/obra-modal.component';
import { ObraResponseDTO } from '../../../../api/model/obraResponseDTO';
import { CreateOcorrenciaDto, MaoDeObraItemDto, ServicoItemDto, EquipamentoItemDto, DiarioResponseDto } from '../../../utils/dto/diario.dto';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

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

  @ViewChild('obraModal') obraModal!: ObraModalComponent;
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state && nav.extras.state['obra']) {
      this.obraSelecionada = nav.extras.state['obra'];
    }
  }

  isEditMode = false;
  diarioId!: number;
  activeTab: 'DIARIO' | 'OCORRENCIAS' = 'DIARIO';

  // Catalogs
  catalogoEquipamentos: any[] = [];
  catalogoMaoDeObra: any[] = [];
  catalogoServicos: any[] = [];

  // Form Data
  obraSelecionada: ObraResponseDTO | null = null;
  dataDiario: string = '';
  condicaoClimatica: string = 'ENSOLARADO';
  observacoes: string = '';

  equipamentosAdicionados: EquipamentoItemDto[] = [];
  maoDeObraAdicionada: MaoDeObraItemDto[] = [];
  servicosAdicionados: ServicoItemDto[] = [];
  ocorrenciasAdicionadas: CreateOcorrenciaDto[] = [];

  buscaEquipamento: string = '';
  buscaMaoDeObra: string = '';
  buscaServico: string = '';

  eqFiltrados: any[] = [];
  moFiltrados: any[] = [];
  svFiltrados: any[] = [];

  mostrarEq = false;
  mostrarMo = false;
  mostrarSv = false;

  tempOcorrenciaTipo: string = '';
  tempOcorrenciaDescricao: string = '';

  fotosNovas: File[] = [];
  fotosExistentes: string[] = []; // URLs from API
  
  carouselCurrentIndex = 0;

  ngOnInit(): void {
    this.dataDiario = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
    
    this.carregarCatalogos();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
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
      error: () => this.snackBar.open('Erro ao carregar diário', 'OK')
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

  // --- Autocomplete Logic ---
  filtrarEq() {
    this.eqFiltrados = this.catalogoEquipamentos.filter(e => e.nome.toLowerCase().includes(this.buscaEquipamento.toLowerCase()));
  }

  filtrarMo() {
    this.moFiltrados = this.catalogoMaoDeObra.filter(e => e.nome.toLowerCase().includes(this.buscaMaoDeObra.toLowerCase()));
  }

  filtrarSv() {
    this.svFiltrados = this.catalogoServicos.filter(e => e.nome.toLowerCase().includes(this.buscaServico.toLowerCase()));
  }

  hideEq() {} 
  hideMo() {} 
  hideSv() {} 

  selecionarEq(event: MatAutocompleteSelectedEvent) {
    const cat = event.option.value; // expected to be the object 'c'
    if (!this.equipamentosAdicionados.find(e => e.equipamentoId === cat.id)) {
      this.equipamentosAdicionados.push({ equipamentoId: cat.id, equipamentoNome: cat.nome, quantidade: 1 });
    }
    this.buscaEquipamento = '';
    // reset selection so text doesn't stay populated
    event.option.deselect();
  }

  selecionarMo(event: MatAutocompleteSelectedEvent) {
    const cat = event.option.value;
    if (!this.maoDeObraAdicionada.find(e => e.maoDeObraId === cat.id)) {
      this.maoDeObraAdicionada.push({ maoDeObraId: cat.id, maoDeObraNome: cat.nome, quantidade: 1 });
    }
    this.buscaMaoDeObra = '';
    event.option.deselect();
  }

  selecionarSv(event: MatAutocompleteSelectedEvent) {
    const cat = event.option.value;
    if (!this.servicosAdicionados.find(e => e.servicoId === cat.id)) {
      this.servicosAdicionados.push({ servicoId: cat.id, servicoNome: cat.nome, quantidade: 1 });
    }
    this.buscaServico = '';
    event.option.deselect();
  }
  
  displayFn(item?: any): string {
    return item ? item.nome : '';
  }

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

  // --- Submit ---
  salvar() {
    if (!this.obraSelecionada || !this.dataDiario || !this.condicaoClimatica) {
      this.snackBar.open('Preencha os campos obrigatórios (Obra, Data, Condição Climática)', 'OK', { duration: 3000 });
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
        error: () => this.snackBar.open('Erro ao atualizar diário', 'OK', { duration: 3000 })
      });
    } else {
      this.diarioService.createDiario(this.obraSelecionada.id!, diarioBlob, this.fotosNovas).subscribe({
        next: () => {
          this.snackBar.open('Diário criado com sucesso!', 'OK', { duration: 3000 });
          this.router.navigate(['/diarios']);
        },
        error: () => this.snackBar.open('Erro ao criar diário', 'OK', { duration: 3000 })
      });
    }
  }

  cancelar() {
    this.router.navigate(['/diarios']);
  }
}
