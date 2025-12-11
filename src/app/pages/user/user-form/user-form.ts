import { Component, inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RolesEnum} from '../../../utils/enums/RolesEnum';
import {MatSelectModule} from '@angular/material/select';
import {UserRegisterDto} from '../../../utils/dto/UserRegisterDto';
import {UserService} from '../../../services/user-service';
@Component({
  selector: 'app-user-form',
  imports: [MatDialogContent, MatDialogTitle, MatFormField, MatLabel, MatInput, MatDialogActions, MatButton, ReactiveFormsModule, MatError, MatSelectModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm implements OnInit{
  readonly dialogRef = inject(MatDialogRef<UserForm>);
  readonly data = inject(MAT_DIALOG_DATA);
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);

  roles = Object.values(RolesEnum);

  userForm = this.formBuilder.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['', Validators.required],
  })

  userId = this.data?.id;
  user = this.data?.user;
  isEditMode = !this.user;

  ngOnInit(): void {
    if(this.user) {
      this.userForm.patchValue({
        name: this.user?.name,
        email: this.user?.login,
        role: this.user?.role,
      });
    }
  }

  onNoClick() {
    this.dialogRef.close(false);
  }

  handleNewUserClick() {
    if (this.userForm.valid) {
      const formValues = this.userForm.value;
      const userDto = new UserRegisterDto();

      userDto.id = this.userId;
      userDto.name = formValues.name ?? "";
      userDto.role = formValues.role ?? RolesEnum.USER;
      userDto.login = formValues.email ?? "";
      userDto.password = formValues.password ?? "";

      this.userService.saveUser(userDto).subscribe({
        next: (res) => {
          console.log(res);
          this.dialogRef.close(true);
        },
        error: (e) => {
          console.log(e);
        }
      });

    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
