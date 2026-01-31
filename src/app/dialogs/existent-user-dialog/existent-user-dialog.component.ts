import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserProfileDto } from '../../utils/dto/user-profile.dto';

export interface DialogData {
  user: UserProfileDto;
  conflictFields: string[];
}

@Component({
  selector: 'app-existent-user-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './existent-user-dialog.component.html',
  styleUrls: ['./existent-user-dialog.component.scss']
})
export class ExistentUserDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ExistentUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  // Helper para verificar se um campo específico está na lista de conflitos
  isConflict(field: string): boolean {
    // Verifica strings parciais, ex: "Login" acha "Login (E-mail)"
    return this.data.conflictFields.some(f => f.toLowerCase().includes(field.toLowerCase()));
  }

  // Helper para formatar a lista de campos em texto (ex: "Login e CPF")
  get formattedFields(): string {
    return this.data.conflictFields.join(', ');
  }

  onConfirm(): void {
    this.dialogRef.close(true); // Editar
  }

  onCancel(): void {
    this.dialogRef.close(false); // Corrigir
  }
}
