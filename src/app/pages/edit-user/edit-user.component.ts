import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserService } from '../../services/user.service';
import { CepService } from '../../services/cep.service';
import { ExistentUserDialogComponent } from '../../dialogs/existent-user-dialog/existent-user-dialog.component';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule
  ],
  providers: [DatePipe],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.scss'
})
export class EditUserComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private cepService = inject(CepService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);

  form!: FormGroup;
  loading = false;
  isNewUser = false;
  isEditOther = false;
  userId: number | null = null;
  hidePassword = true;
  hideConfirmPassword = true;

  // Variável para armazenar a role do usuário LOGADO
  currentUserRole: string = '';

  ngOnInit(): void {
    this.checkRouteContext();
    this.checkCurrentUserRole();
    this.initForm();
    this.loadData();
  }

  //  GETTER PARA O HTML
  get isAdmin(): boolean {
    return this.currentUserRole === 'ADMIN';
  }

  //  MÉTODOS DE ROTEAMENTO E CONFIGURAÇÃO

  private checkRouteContext(): void {
    const urlSegments = this.route.snapshot.url.map(segment => segment.path);
    const paramId = this.route.snapshot.paramMap.get('id');

    if (urlSegments.includes('new')) {
      this.isNewUser = true;
    } else if (paramId) {
      this.isEditOther = true;
      this.userId = Number(paramId);
    } else {
      this.isNewUser = false;
      this.isEditOther = false;
    }
  }

  private checkCurrentUserRole(): void {
    this.userService.getMyProfile().subscribe({
      next: (user: any) => {
        this.currentUserRole = user.role;
        if (this.form) {
          this.updateFormPermissions();
        }
      },
      error: () => console.warn('Não foi possível verificar permissões do usuário logado.')
    });
  }

  private initForm(): void {
    const phonePattern = /^\(\d{2}\) \d{5}-\d{4}$/;
    const namePattern = /^[a-zA-ZÀ-ÿ\s]*$/;

    this.form = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(namePattern)]],
      login: [{ value: '', disabled: !this.isNewUser }, [Validators.required, Validators.email]],
      cpf: [{ value: '', disabled: !this.isNewUser }, [Validators.required]],
      role: [{ value: 'USER', disabled: !this.isNewUser && !this.isEditOther }, [Validators.required]],

      // Campo 'enabled'
      enabled: [{ value: true, disabled: this.isNewUser }],

      creationDate: [{ value: '', disabled: true }],
      phone1: ['', [Validators.required, Validators.pattern(phonePattern)]],
      phone2: ['', [Validators.pattern(phonePattern)]],
      crea: [''],
      creaUf: [''],
      zipCode: [''],
      city: [{ value: '', disabled: true }],
      state: [{ value: '', disabled: true }],
      address: ['', [Validators.maxLength(100)]],
      addressNumber: ['', [Validators.maxLength(5)]],
      complement: ['', [Validators.maxLength(50)]],
      password: [''],
      confirmPassword: ['']
    }, { validators: [this.passwordMatchValidator] });

    if (this.isNewUser) {
      this.form.get('password')?.addValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('confirmPassword')?.addValidators([Validators.required]);
      this.form.get('login')?.enable();
      this.form.get('cpf')?.enable();
      this.form.get('role')?.enable();
    } else {
      this.form.get('password')?.addValidators([Validators.minLength(6)]);
    }

    this.updateFormPermissions();
    this.form.updateValueAndValidity();
  }

  private updateFormPermissions(): void {
    if (this.isEditOther && this.isAdmin) {
      this.form.get('role')?.enable();
      this.form.get('login')?.enable();
      this.form.get('cpf')?.enable();
      this.form.get('enabled')?.enable();
    }
  }

  private loadData(): void {
    if (this.isNewUser) return;
    this.loading = true;
    let requestObservable;

    if (this.isEditOther && this.userId) {
      requestObservable = this.userService.getUserProfile(this.userId);
    } else {
      requestObservable = this.userService.getMyProfile();
    }

    requestObservable.subscribe({
      next: (user: any) => {
        if (!this.userId) this.userId = user.id;
        const formattedDate = user.creationDate ? this.datePipe.transform(user.creationDate, 'dd/MM/yyyy') : '';

        this.form.patchValue({
          id: user.id,
          name: user.name,
          login: user.login,
          role: user.role,
          enabled: user.enabled,
          creationDate: formattedDate,
          cpf: user.cpf,
          crea: user.crea,
          creaUf: user.creaUf,
          phone1: user.phone1,
          phone2: user.phone2,
          zipCode: user.zipCode,
          address: user.address,
          addressNumber: user.addressNumber,
          complement: user.complement,
          city: user.city,
          state: user.state
        });
        this.loading = false;
      },
      error: (err: any) => {
        this.snackBar.open('Erro ao carregar dados.', 'Fechar', { duration: 3000 });
        this.loading = false;
        if (this.isEditOther) this.location.back();
      }
    });
  }

  //  VALIDATORS E HELPERS

  passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    if (control.get('confirmPassword')?.hasError('passwordMismatch')) control.get('confirmPassword')?.setErrors(null);
    return null;
  };

  formatarTelefone(event: any): void {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 10) value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
    else if (value.length > 6) value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    else if (value.length > 2) value = value.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
    else if (value.length > 0) value = value.replace(/^(\d*)/, '($1');
    input.value = value;
    this.form.get(input.id)?.setValue(value, { emitEvent: false });
  }

  formatarCpf(event: any): void {
    const input = event.target;
    // Remove tudo que não for dígito
    let value = input.value.replace(/\D/g, '');

    // Limita a 11 dígitos
    if (value.length > 11) value = value.substring(0, 11);

    // Aplica a máscara: 000.000.000-00
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    input.value = value;
    // Atualiza o form control sem disparar novo evento para evitar loop
    this.form.get('cpf')?.setValue(value, { emitEvent: false });
  }

  consultaCep(): void {
    const cep = this.form.get('zipCode')?.value;
    if (cep && cep.length >= 8) {
      this.loading = true;
      this.cepService.buscarCep(cep).subscribe({
        next: (dados) => {
          this.loading = false;
          if (dados && !dados.erro) {
            this.form.patchValue({ address: dados.logradouro, city: dados.localidade, state: dados.uf });
            document.getElementById('addressNumber')?.focus();
          } else {
            this.snackBar.open('CEP não encontrado.', 'Fechar', { duration: 3000 });
          }
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Erro ao buscar CEP.', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  // METODO PARA OBTER CLASSE CSS DA ROLE
  getRoleClass(role?: string): string {
    const r = role?.toUpperCase() || '';
    switch (r) {
      case 'ADMIN': return 'role-admin';
      case 'GESTOR': return 'role-gestor';
      case 'ENGENHEIRO': return 'role-engenheiro';
      case 'FISCAL': return 'role-fiscal';
      default: return '';
    }
  }

  //  SUBMISSÃO

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Verifique os campos inválidos.', 'Fechar', { duration: 4000 });
      return;
    }

    const formValue = this.form.getRawValue();

    delete formValue.creationDate;
    delete formValue.confirmPassword;

    if (this.isNewUser) {
      formValue.id = null;
      delete formValue.enabled;
    }

    if (!formValue.password) delete formValue.password;

    this.loading = true;

    this.userService.saveUser(formValue).subscribe({
      next: (res: any) => {
        const msg = this.isNewUser ? 'Usuário criado com sucesso!' : 'Perfil atualizado com sucesso!';
        this.snackBar.open(msg, 'OK', { duration: 3000 });

        if (this.isNewUser || this.isEditOther) {
          this.router.navigate(['/manage-users']);
        } else {
          this.router.navigate(['/user']);
        }
      },
      error: (err: any) => {
        this.loading = false;

        let errorBody = err.error;
        if (typeof errorBody === 'string') {
          try {
            errorBody = JSON.parse(errorBody);
          } catch (e) {
            console.error('Falha ao converter erro para JSON:', e);
          }
        }

        if (err.status === 409 && errorBody && errorBody.type === 'DATA_CONFLICT') {
          const dialogRef = this.dialog.open(ExistentUserDialogComponent, {
            width: '500px',
            //disableClose: true,
            panelClass: 'custom-dialog-container',
            data: {
              user: errorBody.user,
              conflictFields: errorBody.conflictFields
            }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
              this.router.navigate(['/user/edit', errorBody.user.id]);
            }
          });
        } else if (err.status === 409 || err.status === 400) {
          const message = errorBody?.message || errorBody || 'Erro de validação.';
          this.snackBar.open(message, 'Fechar', { duration: 5000 });
        } else {
          this.snackBar.open('Erro ao salvar dados.', 'Fechar', { duration: 3000 });
        }
      }
    });
  }

  onCancel(): void {
    this.location.back();
  }
}
