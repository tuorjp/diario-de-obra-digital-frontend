import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ObraControllerService } from '../../../../api/api/obraController.service';
import { UserService } from '../../../services/user.service';
import { CepService } from '../../../services/cep.service';
import { UserProfileDTO } from '../../../../api/model/userProfileDTO';
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
  successMsg: string | null = null;

  // Lists for dropdowns
  allUsers: UserProfileDTO[] = [];
  fiscais: UserProfileDTO[] = [];
  engenheiros: UserProfileDTO[] = [];

  // Auto-filled CREA info
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
    this.loadUsers();

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

    // Watch fiscal change
    this.form.get('fiscalId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.onFiscalChange(id);
    });
    // Watch engenheiro 1 change
    this.form.get('engenheiroId1')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.onEngChange(id, 1);
    });
    // Watch engenheiro 2 change
    this.form.get('engenheiroId2')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.onEngChange(id, 2);
    });
  }

  private loadUsers(): void {
    this.userService.getFiscaisEEngenheiros().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: any) => {
        const list: UserProfileDTO[] = Array.isArray(users) ? users : [];
        this.allUsers = list;
        this.fiscais = list.filter(u => u.role === 'FISCAL' && u.enabled);
        this.engenheiros = list.filter(u => u.role === 'ENGENHEIRO' && u.enabled);
      },
      error: () => console.warn('Erro ao carregar usuários.')
    });
  }

  private loadObra(id: number): void {
    this.loading = true;
    this.cdr.detectChanges(); // Força a tela a mostrar carregando imediatamente

    this.obraService.findById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => {
        try {
          const obra = (data && data.data) ? data.data : data;
          // Convert date arrays to ISO strings if needed
          const toIso = (d: any): string => {
            if (!d) return '';
            if (Array.isArray(d) && d.length >= 3) {
              const [y, m, day] = d;
              return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
            if (typeof d === 'string') return d;
            return '';
          };

          this.form.patchValue({
            projeto: obra.projeto ?? '',
            numeroContrato: obra.numeroContrato ?? '',
            contratante: obra.contratante ?? '',
            contratada: obra.contratada ?? '',
            dataInicio: toIso(obra.dataInicio),
            dataPrevistaFim: toIso(obra.dataPrevistaFim),
            cep: obra.endereco?.cep ?? '',
            cidade: obra.endereco?.cidade ?? '',
            uf: obra.endereco?.uf ?? '',
            endereco: obra.endereco?.endereco ?? '',
            complemento: obra.endereco?.complemento ?? '',
            numero: obra.endereco?.numero ?? '',
            fiscalId: obra.fiscal?.id ?? null,
            observacao: obra.observacao ?? ''
          });

          // Populate CREA info for auto-display
          if (obra.fiscal) {
            this.fiscalCrea = obra.fiscal.crea ?? '';
            this.fiscalCreaUf = obra.fiscal.creaUf ?? '';
            if (!this.fiscais.some(f => f.id === obra.fiscal.id)) {
              this.fiscais.push(obra.fiscal);
            }
          }

          // Handle engenheiros (up to 2)
          const engs: UserProfileDTO[] = obra.engenheiros
            ? Array.from(obra.engenheiros as any)
            : [];
          
          engs.forEach(e => {
            if (e.id && !this.engenheiros.some(x => x.id === e.id)) {
              this.engenheiros.push(e);
            }
          });

          if (engs[0]) {
            this.form.patchValue({ engenheiroId1: engs[0].id });
            this.eng1Crea = engs[0].crea ?? '';
            this.eng1CreaUf = engs[0].creaUf ?? '';
          }
          if (engs[1]) {
            this.form.patchValue({ engenheiroId2: engs[1].id });
            this.eng2Crea = engs[1].crea ?? '';
            this.eng2CreaUf = engs[1].creaUf ?? '';
          }

          this.loading = false;
          this.cdr.detectChanges(); // Força atualização da tela
        } catch (e: any) {
          console.error("[ObraForm] Erro interno no loadObra:", e);
          this.errorMsg = `Erro ao processar dados da obra: ${e.message || e}`;
          this.loading = false;
          this.cdr.detectChanges(); // Força atualização da tela
        }
      },
      error: err => {
        console.error('[ObraForm] Erro no findById', err);
        this.errorMsg = `Erro ao carregar obra: ${err.status}`;
        this.loading = false;
        this.cdr.detectChanges(); // Força atualização da tela
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

  private onFiscalChange(id: number | null): void {
    const user = this.allUsers.find(u => u.id === Number(id));
    this.fiscalCrea = user?.crea ?? '';
    this.fiscalCreaUf = user?.creaUf ?? '';
  }

  private onEngChange(id: number | null, slot: 1 | 2): void {
    const user = this.allUsers.find(u => u.id === Number(id));
    if (slot === 1) {
      this.eng1Crea = user?.crea ?? '';
      this.eng1CreaUf = user?.creaUf ?? '';
    } else {
      this.eng2Crea = user?.crea ?? '';
      this.eng2CreaUf = user?.creaUf ?? '';
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    const engenheiroIds = new Set<number>();
    if (v.engenheiroId1) engenheiroIds.add(Number(v.engenheiroId1));
    if (v.engenheiroId2) engenheiroIds.add(Number(v.engenheiroId2));

    const endereco = {
      cep: v.cep || undefined,
      cidade: v.cidade || undefined,
      uf: v.uf || undefined,
      endereco: v.endereco || undefined,
      complemento: v.complemento || undefined,
      numero: v.numero || undefined
    };

    const basePayload = {
      projeto: v.projeto,
      numeroContrato: v.numeroContrato || undefined,
      contratante: v.contratante,
      contratada: v.contratada,
      dataInicio: v.dataInicio || undefined,
      dataPrevistaFim: v.dataPrevistaFim || undefined,
      observacao: v.observacao || undefined,
      fiscalId: v.fiscalId ? Number(v.fiscalId) : undefined,
      engenheiroIds: engenheiroIds.size > 0 ? (Array.from(engenheiroIds) as any) : undefined,
      endereco: Object.values(endereco).some(x => x) ? endereco : undefined
    };

    this.saving = true;
    this.errorMsg = null;

    if (this.isEditMode && this.obraId) {
      const dto: UpdateObraDTO = basePayload;
      this.obraService.update(this.obraId, dto).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/obras']);
        },
        error: err => {
          this.saving = false;
          const backendMsg = typeof err.error === 'string' ? err.error : '';
          this.errorMsg = backendMsg || `Erro ao salvar: ${err.status} ${err.statusText ?? ''}`;
        }
      });
    } else {
      const dto: CreateObraDTO = basePayload;
      this.obraService.create(dto).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/obras']);
        },
        error: err => {
          this.saving = false;
          const backendMsg = typeof err.error === 'string' ? err.error : '';
          this.errorMsg = backendMsg || `Erro ao criar obra: ${err.status} ${err.statusText ?? ''}`;
        }
      });
    }
  }

  onCancel(): void {
    this.location.back();
  }

  goHome(): void { this.router.navigate(['/dashboard']); }
  goObras(): void { this.router.navigate(['/obras']); }

  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('dataInicio')?.value;
    const end = group.get('dataPrevistaFim')?.value;
    if (start && end && start > end) {
      return { dateRangeInvalid: true };
    }
    return null;
  }

  private notPastDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    if (control.value < todayStr) {
      return { pastDate: true };
    }
    return null;
  }
}
