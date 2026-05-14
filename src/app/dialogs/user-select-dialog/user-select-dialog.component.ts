import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { UserProfileDto } from '../../utils/dto/user-profile.dto';

export interface UserSelectDialogData {
  role: 'FISCAL' | 'ENGENHEIRO';
  excludeId?: number | null;
  title: string;
}

@Component({
  selector: 'app-user-select-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './user-select-dialog.component.html',
  styleUrls: ['./user-select-dialog.component.scss']
})
export class UserSelectDialogComponent implements OnInit {
  private userService = inject(UserService);

  allUsers: UserProfileDto[] = [];
  filteredUsers: UserProfileDto[] = [];

  filterName = '';
  filterEmail = '';
  filterCrea = '';

  loading = true;
  error = false;

  constructor(
    public dialogRef: MatDialogRef<UserSelectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserSelectDialogData
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading = true;
    this.error = false;

    this.userService.searchUsers(0, 500, 'name', 'asc', '', this.data.role, true)
      .subscribe({
        next: (res) => {
          this.allUsers = (res.content ?? []).filter(u => u.id !== this.data.excludeId);
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.error = true;
          this.loading = false;
        }
      });
  }

  applyFilters(): void {
    const name = this.filterName.trim().toLowerCase();
    const email = this.filterEmail.trim().toLowerCase();
    const crea = this.filterCrea.trim().toLowerCase();

    this.filteredUsers = this.allUsers.filter(u => {
      const matchName = !name || (u.name ?? '').toLowerCase().includes(name);
      const matchEmail = !email || (u.login ?? '').toLowerCase().includes(email);
      const matchCrea = !crea || (u.crea ?? '').toLowerCase().includes(crea);
      return matchName && matchEmail && matchCrea;
    });
  }

  selectUser(user: UserProfileDto): void {
    this.dialogRef.close(user);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
