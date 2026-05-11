import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ObraControllerService } from '../../../../api/api/obraController.service';
import { UserService } from '../../../services/user.service';
import { CepService } from '../../../services/cep.service';
import { CreateObraDTO } from '../../../../api/model/createObraDTO';
import { UpdateObraDTO } from '../../../../api/model/updateObraDTO';

@Component({
  selector: 'app-obra-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './obra-form.component.html',
  styleUrls: ['./obra-form.component.scss']
})
export class ObraFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private obraService = inject(ObraControllerService);
  private userService = inject(UserService);
  private cepService = inject(CepService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  isEditMode = false;
  obraId: number | null = null;
  loading = false;
  saving = false;
  errorMsg: string | null = null;

  // Listas para Autocomplete
  fiscaisFiltrados: any[] = [];
  engenheiros1Filtrados: any[] = [];
  engenheiros2Filtrados: any[] = [];

  // Controle de exibição dos Dropdowns
  showFiscalDropdown: boolean = false;
  showEng1Dropdown: boolean = false;
  showEng2Dropdown: boolean = false;

  // IDs selecionados (Controle de segurança)
  selectedFiscalId: number | null = null;
  selectedEng1Id: number | null = null;
  selectedEng2Id: number | null = null;

  // Informações de CREA exibidas na tela
  fiscalCrea = '';
  fiscalCreaUf = '';
  eng1Crea = '';
  eng1CreaUf = '';
  eng2Crea = '';
  eng2CreaUf = '';

  readonly UF_OPTIONS = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ];

  ngOnInit(): void {
    this.initForm();
    this.setupAutocompletes();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.obraId = parseInt(idParam, 10);
      this.loadObra(this.obraId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      projeto: ['', Validators.required],
      numeroContrato: [''],
      contratante: ['', Validators.required],
      contratada: ['', Validators.required],
      dataInicio: ['', this.notPastDateValidator],
      dataPrevistaFim: [''],
      cep: [''],
      cidade: [''],
      uf: [''],
      endereco: [''],
      complemento: [''],
      numero: [''],
      fiscalId: [null],
      engenheiroId1: [null],
      engenheiroId2: [null],
      observacao: ['']
    }, { validators: this.dateRangeValidator });
  }

  private setupAutocompletes(): void {
    const setupField = (controlName: string, role: string, listKey: string, idKey: string, creaKey: string, ufKey: string) => {
      this.form.get(controlName)?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          // Limpa ID e CREA assim que o usuário digita qualquer coisa nova
          (this as any)[idKey] = null;
          (this as any)[creaKey] = '';
          (this as any)[ufKey] = '';
          this.form.get(controlName)?.setErrors(null);
          this.cdr.detectChanges();

          if (!value || typeof value !== 'string' || value.trim().length < 2) {
            (this as any)[listKey] = [];
            return of(null);
          }
          // Chamada ao serviço: page, size, sortField, sortDir, term, role, hideInactive
          return this.userService.searchUsers(0, 10, 'name', 'asc', value, role, true);
        }),
        takeUntil(this.destroy$)
      ).subscribe(res => {
        (this as any)[listKey] = res ? res.content : [];
        this.cdr.detectChanges();
      });
    };

    setupField('fiscalId', 'FISCAL', 'fiscaisFiltrados', 'selectedFiscalId', 'fiscalCrea', 'fiscalCreaUf');
    setupField('engenheiroId1', 'ENGENHEIRO', 'engenheiros1Filtrados', 'selectedEng1Id', 'eng1Crea', 'eng1CreaUf');
    setupField('engenheiroId2', 'ENGENHEIRO', 'engenheiros2Filtrados', 'selectedEng2Id', 'eng2Crea', 'eng2CreaUf');
  }

  selectUser(user: any, controlName: string): void {
    this.form.get(controlName)?.setValue(user.name, { emitEvent: false });

    if (controlName === 'fiscalId') {
      this.selectedFiscalId = user.id;
      this.fiscalCrea = user.crea || '';
      this.fiscalCreaUf = user.creaUf || '';
      this.fiscaisFiltrados = [];
      this.showFiscalDropdown = false;
    } else if (controlName === 'engenheiroId1') {
      this.selectedEng1Id = user.id;
      this.eng1Crea = user.crea || '';
      this.eng1CreaUf = user.creaUf || '';
      this.engenheiros1Filtrados = [];
      this.showEng1Dropdown = false;
    } else if (controlName === 'engenheiroId2') {
      this.selectedEng2Id = user.id;
      this.eng2Crea = user.crea || '';
      this.eng2CreaUf = user.creaUf || '';
      this.engenheiros2Filtrados = [];
      this.showEng2Dropdown = false;
    }
    this.cdr.detectChanges();
  }

  private validarUsuariosSelecionados(): boolean {
    let erro = false;
    this.errorMsg = null;

    const validacoes = [
      { ctrl: 'fiscalId', id: this.selectedFiscalId, label: 'Fiscal' },
      { ctrl: 'engenheiroId1', id: this.selectedEng1Id, label: 'Engenheiro 1' },
      { ctrl: 'engenheiroId2', id: this.selectedEng2Id, label: 'Engenheiro 2' }
    ];

    validacoes.forEach(v => {
      const valorTexto = this.form.get(v.ctrl)?.value;
      // Se tem texto digitado mas não tem ID correspondente, bloqueia
      if (valorTexto && valorTexto.trim() !== '' && !v.id) {
        this.form.get(v.ctrl)?.setErrors({ userNotFound: true });
        this.errorMsg = `Selecione um ${v.label} válido da lista ou deixe o campo vazio.`;
        erro = true;
      }
    });

    return !erro;
  }

  onSubmit(): void {
    if (!this.validarUsuariosSelecionados()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const engenheiroIds: number[] = [];
    if (this.selectedEng1Id) engenheiroIds.push(this.selectedEng1Id);
    if (this.selectedEng2Id) engenheiroIds.push(this.selectedEng2Id);

    const payload: any = {
      projeto: v.projeto,
      numeroContrato: v.numeroContrato || undefined,
      contratante: v.contratante,
      contratada: v.contratada,
      dataInicio: v.dataInicio || undefined,
      dataPrevistaFim: v.dataPrevistaFim || undefined,
      observacao: v.observacao || undefined,
      fiscalId: this.selectedFiscalId || undefined,
      engenheiroIds: engenheiroIds.length > 0 ? engenheiroIds : undefined,
      endereco: {
        cep: v.cep || undefined,
        cidade: v.cidade || undefined,
        uf: v.uf || undefined,
        endereco: v.endereco || undefined,
        complemento: v.complemento || undefined,
        numero: v.numero || undefined
      }
    };

    this.saving = true;
    const request = (this.isEditMode && this.obraId)
      ? this.obraService.update(this.obraId, payload as UpdateObraDTO)
      : this.obraService.create(payload as CreateObraDTO);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.router.navigate(['/obras']),
      error: err => {
        this.saving = false;
        this.errorMsg = err.error || 'Erro ao salvar obra.';
        this.cdr.detectChanges();
      }
    });
  }

  private loadObra(id: number): void {
    this.loading = true;
    this.obraService.findById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => {
        const obra = (data && data.data) ? data.data : data;
        const toIso = (d: any): string => {
          if (Array.isArray(d) && d.length >= 3) {
            return `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}`;
          }
          return typeof d === 'string' ? d : '';
        };

        // Adicionado { emitEvent: false } para não disparar a limpeza do autocomplete
        this.form.patchValue({
          projeto: obra.projeto,
          numeroContrato: obra.numeroContrato,
          contratante: obra.contratante,
          contratada: obra.contratada,
          dataInicio: toIso(obra.dataInicio),
          dataPrevistaFim: toIso(obra.dataPrevistaFim),
          cep: obra.endereco?.cep,
          cidade: obra.endereco?.cidade,
          uf: obra.endereco?.uf,
          endereco: obra.endereco?.endereco,
          complemento: obra.endereco?.complemento,
          numero: obra.endereco?.numero,
          observacao: obra.observacao,
          fiscalId: obra.fiscal?.name
        }, { emitEvent: false });

        if (obra.fiscal) {
          this.selectedFiscalId = obra.fiscal.id;
          this.fiscalCrea = obra.fiscal.crea || '';
          this.fiscalCreaUf = obra.fiscal.creaUf || '';
        }

        const engs = obra.engenheiros || [];
        if (engs[0]) {
          // Adicionado { emitEvent: false }
          this.form.patchValue({ engenheiroId1: engs[0].name }, { emitEvent: false });
          this.selectedEng1Id = engs[0].id;
          this.eng1Crea = engs[0].crea || '';
          this.eng1CreaUf = engs[0].creaUf || '';
        }
        if (engs[1]) {
          // Adicionado { emitEvent: false }
          this.form.patchValue({ engenheiroId2: engs[1].name }, { emitEvent: false });
          this.selectedEng2Id = engs[1].id;
          this.eng2Crea = engs[1].crea || '';
          this.eng2CreaUf = engs[1].creaUf || '';
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'Erro ao carregar obra.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCepBlur(): void {
    const cep = this.form.get('cep')?.value ?? '';
    if (cep.replace(/\D/g, '').length === 8) {
      this.cepService.buscarCep(cep).pipe(takeUntil(this.destroy$)).subscribe({
        next: res => {
          if (res && !res.erro) {
            this.form.patchValue({
              cidade: res.localidade,
              uf: res.uf,
              endereco: res.logradouro ?? this.form.get('endereco')?.value
            });
          }
        }
      });
    }
  }

  onCancel(): void { this.location.back(); }
  goHome(): void { this.router.navigate(['/dashboard']); }
  goObras(): void { this.router.navigate(['/obras']); }

  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('dataInicio')?.value;
    const end = group.get('dataPrevistaFim')?.value;
    return (start && end && start > end) ? { dateRangeInvalid: true } : null;
  }

  private notPastDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    return control.value < today ? { pastDate: true } : null;
  }
}
