import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../services/user-service';
import { EditUserDto } from '../../utils/dto/edit-user.dto';
import { CommonModule, Location, DatePipe } from '@angular/common';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Essencial para funcionar o [formGroup]
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  providers: [DatePipe], // Essencial para injetar o DatePipe
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.scss'
})
export class EditUserComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  form!: FormGroup;
  loading = false;
  userId: number | null = null;

  ufs: string[] = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadCurrentUser();
  }

  private initForm(): void {
    this.form = this.fb.group({
      id: [null],
      name: ['', Validators.required],

      // BLOQUEADOS:
      login: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      cpf: [{ value: '', disabled: true }],
      role: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
      creationDate: [{ value: '', disabled: true }],

      // EDITÁVEIS:
      crea: [''],
      creaUf: [''],
      phone1: [''],
      phone2: [''],
      zipCode: [''],
      address: [''],
      addressNumber: [''],
      complement: [''],
      city: [''],
      state: [''],
      password: ['']
    });
  }

  private loadCurrentUser(): void {
    this.loading = true;
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.userId = user.id;

        const formattedDate = user.creationDate ? this.datePipe.transform(user.creationDate, 'dd/MM/yyyy') : '';

        this.form.patchValue({
          id: user.id,
          name: user.name,
          login: user.login,
          role: user.role,
          status: user.status,
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
      this.snackBar.open('Preencha os campos obrigatórios.', 'Fechar', { duration: 3000 });
      return;
    }

    const formValue = this.form.getRawValue();
    delete formValue.creationDate;

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
        console.error('Erro ao salvar', err);
        this.snackBar.open('Erro ao salvar alterações.', 'Fechar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.location.back();
  }
}
