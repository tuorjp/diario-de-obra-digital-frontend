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
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../services/user.service';
import { CepService } from '../../services/cep.service';
import { EditUserDto } from '../../utils/dto/edit-user.dto';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
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
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  form!: FormGroup;
  loading = false;
  userId: number | null = null;

  hidePassword = true;
  hideConfirmPassword = true;

  // Lista 'ufs' removida pois agora o campo UF é um input de texto simples preenchido pelo CEP.

  ngOnInit(): void {
    this.initForm();
    this.loadCurrentUser();
  }

  private initForm(): void {
    const phonePattern = /^\(\d{2}\) \d{5}-\d{4}$/;
    const namePattern = /^[a-zA-ZÀ-ÿ\s]*$/;

    this.form = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(namePattern)]],

      login: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      cpf: [{ value: '', disabled: true }],
      role: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
      creationDate: [{ value: '', disabled: true }],

      city: [{ value: '', disabled: true }],
      state: [{ value: '', disabled: true }],

      crea: [''],
      creaUf: [''],

      phone1: ['', [Validators.required, Validators.pattern(phonePattern)]],
      phone2: ['', [Validators.pattern(phonePattern)]],

      zipCode: [''],

      address: ['', [Validators.maxLength(100)]],
      // ALTERAÇÃO: Máximo de 5 caracteres
      addressNumber: ['', [Validators.maxLength(5)]],
      complement: ['', [Validators.maxLength(50)]],

      password: ['', [Validators.minLength(6)]],
      confirmPassword: ['']

    }, {
      validators: [this.passwordMatchValidator]
    });
  }

  passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (control.get('confirmPassword')?.hasError('passwordMismatch')) {
        control.get('confirmPassword')?.setErrors(null);
      }
      return null;
    }
  };

  formatarTelefone(event: any): void {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 11) value = value.substring(0, 11);

    if (value.length > 10) {
      value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
    } else if (value.length > 0) {
      value = value.replace(/^(\d*)/, '($1');
    }

    input.value = value;
    this.form.get(input.id)?.setValue(value, { emitEvent: false });
  }

  consultaCep(): void {
    const cep = this.form.get('zipCode')?.value;
    if (cep && cep.length >= 8) {
      this.loading = true;
      this.cepService.buscarCep(cep).subscribe({
        next: (dados) => {
          this.loading = false;
          if (dados && !dados.erro) {
            this.form.patchValue({
              address: dados.logradouro,
              city: dados.localidade,
              state: dados.uf
            });
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

  private loadCurrentUser(): void {
    this.loading = true;
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.userId = user.id;
        const formattedDate = user.creationDate ? this.datePipe.transform(user.creationDate, 'dd/MM/yyyy') : '';
        const statusTexto = user.enabled ? 'Ativo' : 'Inativo';

        this.form.patchValue({
          id: user.id,
          name: user.name,
          login: user.login,
          role: user.role,
          status: statusTexto,
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
      error: (err) => {
        console.error('Erro ao carregar usuário', err);
        this.snackBar.open('Erro ao carregar dados.', 'Fechar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.snackBar.open('Verifique os campos inválidos.', 'Fechar', { duration: 4000 });
      return;
    }

    const formValue = this.form.getRawValue();

    delete formValue.creationDate;
    delete formValue.status;
    delete formValue.confirmPassword;

    if (!formValue.password) {
      delete formValue.password;
    }

    const dto: EditUserDto = formValue;

    this.loading = true;
    this.userService.saveUser(dto).subscribe({
      next: () => {
        this.snackBar.open('Perfil atualizado com sucesso!', 'OK', { duration: 3000 });
        this.router.navigate(['/user']);
      },
      error: (err) => {
        if (err.status === 409 || err.status === 400) {
          this.snackBar.open(err.error?.message || 'Erro de validação.', 'Fechar', { duration: 5000 });
        } else {
          this.snackBar.open('Erro ao salvar alterações.', 'Fechar', { duration: 3000 });
        }
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.location.back();
  }
}
