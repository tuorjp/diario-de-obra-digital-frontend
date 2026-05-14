import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ObraControllerService } from '../../../../api/api/obraController.service';
import { UserService } from '../../../services/user.service';
import { CepService } from '../../../services/cep.service';
import { CreateObraDTO } from '../../../../api/model/createObraDTO';
import { UpdateObraDTO } from '../../../../api/model/updateObraDTO';
import { UserSelectDialogComponent, UserSelectDialogData } from '../../../dialogs/user-select-dialog/user-select-dialog.component';
import { UserProfileDto } from '../../../utils/dto/user-profile.dto';
import { extractErrorMessage } from '../../../utils/extract-error-message';

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
  private dialog = inject(MatDialog);
  private zone = inject(NgZone);
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  isEditMode = false;
  obraId: number | null = null;
  loading = false;
  saving = false;
  errorMsg: string | null = null;

  // IDs selecionados
  selectedFiscalId: number | null = null;
  selectedEng1Id: number | null = null;
  selectedEng2Id: number | null = null;

  // Nomes exibidos nos campos
  fiscalNome = '';
  eng1Nome = '';
  eng2Nome = '';

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
      dataInicio: [''],
      dataPrevistaFim: [''],
      cep: [''],
      cidade: [''],
      uf: [''],
      endereco: [''],
      complemento: [''],
      numero: [''],
      observacao: ['']
    }, { validators: this.dateRangeValidator });
  }

  openUserSelectDialog(field: 'fiscal' | 'eng1' | 'eng2'): void {
    const isFiscal = field === 'fiscal';
    const excludeId = field === 'eng1' ? this.selectedEng2Id
                    : field === 'eng2' ? this.selectedEng1Id
                    : null;

    const dialogData: UserSelectDialogData = {
      role: isFiscal ? 'FISCAL' : 'ENGENHEIRO',
      title: isFiscal ? 'Selecionar Fiscal do Contrato' : `Selecionar Engenheiro ${field === 'eng1' ? '1' : '2'}`,
      excludeId
    };

    const ref = this.dialog.open(UserSelectDialogComponent, {
      data: dialogData,
      panelClass: 'user-select-panel',
      maxWidth: '720px',
      width: '90vw'
    });

    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((user: UserProfileDto | null) => {
      if (user) {
        this.zone.run(() => this.applyUserSelection(field, user));
      }
    });
  }

  private applyUserSelection(field: 'fiscal' | 'eng1' | 'eng2', user: UserProfileDto): void {
    if (field === 'fiscal') {
      this.selectedFiscalId = user.id;
      this.fiscalNome = user.name;
      this.fiscalCrea = user.crea || '';
      this.fiscalCreaUf = user.creaUf || '';
    } else if (field === 'eng1') {
      this.selectedEng1Id = user.id;
      this.eng1Nome = user.name;
      this.eng1Crea = user.crea || '';
      this.eng1CreaUf = user.creaUf || '';
    } else {
      this.selectedEng2Id = user.id;
      this.eng2Nome = user.name;
      this.eng2Crea = user.crea || '';
      this.eng2CreaUf = user.creaUf || '';
    }
    // Defer to next macrotask so the dialog close animation finishes
    // before Angular runs change detection on this component's view.
    setTimeout(() => this.cdr.detectChanges());
  }

  clearUser(field: 'fiscal' | 'eng1' | 'eng2'): void {
    if (field === 'fiscal') {
      this.selectedFiscalId = null;
      this.fiscalNome = '';
      this.fiscalCrea = '';
      this.fiscalCreaUf = '';
    } else if (field === 'eng1') {
      this.selectedEng1Id = null;
      this.eng1Nome = '';
      this.eng1Crea = '';
      this.eng1CreaUf = '';
    } else {
      this.selectedEng2Id = null;
      this.eng2Nome = '';
      this.eng2Crea = '';
      this.eng2CreaUf = '';
    }
    this.cdr.detectChanges();
  }

  onSubmit(): void {
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
      error: async err => {
        this.saving = false;
        this.errorMsg = await extractErrorMessage(err, 'Erro ao salvar obra. Tente novamente.');
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
          observacao: obra.observacao
        });

        if (obra.fiscal) {
          this.selectedFiscalId = obra.fiscal.id;
          this.fiscalNome = obra.fiscal.name;
          this.fiscalCrea = obra.fiscal.crea || '';
          this.fiscalCreaUf = obra.fiscal.creaUf || '';
        }

        const engs = obra.engenheiros || [];
        if (engs[0]) {
          this.selectedEng1Id = engs[0].id;
          this.eng1Nome = engs[0].name;
          this.eng1Crea = engs[0].crea || '';
          this.eng1CreaUf = engs[0].creaUf || '';
        }
        if (engs[1]) {
          this.selectedEng2Id = engs[1].id;
          this.eng2Nome = engs[1].name;
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
}
