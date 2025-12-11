import {Component, inject} from '@angular/core';
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
export class UserForm {
  readonly dialogRef = inject(MatDialogRef<UserForm>);
  readonly data = inject(MAT_DIALOG_DATA);
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);

  roles = Object.values(RolesEnum);

  userForm = this.formBuilder.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: ['', Validators.required],
  })

  userId = this.data?.id;

  onNoClick() {
    this.dialogRef.close();
  }

  handleNewUserClick() {
    if (this.userForm.valid) {
      console.log(this.userForm.value);
      const formValues = this.userForm.value;
      const user = new UserRegisterDto();

      user.id = this.userId;
      user.name = formValues.name ?? "";
      user.userRole = formValues.role ?? RolesEnum.USER;
      user.login = formValues.email ?? "";
      user.password = formValues.password ?? "";

      this.userService.saveUser(user).subscribe({
        next: (res) => {
          console.log(res);
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
