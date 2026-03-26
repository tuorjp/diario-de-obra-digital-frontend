import { Component, EventEmitter, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObraControllerService } from '../../../../../api/api/obraController.service';
import { ObraResponseDTO } from '../../../../../api/model/obraResponseDTO';

@Component({
  selector: 'app-obra-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './obra-modal.component.html',
  styleUrls: ['./obra-modal.component.scss']
})
export class ObraModalComponent {
  isOpen = false;
  termoBusca = '';
  obras: ObraResponseDTO[] = [];
  loading = false;
  
  @Output() obraSelected = new EventEmitter<ObraResponseDTO>();
  private obraService = inject(ObraControllerService);
  private cdr = inject(ChangeDetectorRef);

  open() {
    this.isOpen = true;
    this.obras = [];
    this.termoBusca = '';
  }

  close() {
    this.isOpen = false;
  }

  search() {
    this.loading = true;
    this.obraService.search(0, 50, 'projeto', 'asc', 'projeto', this.termoBusca.trim() || undefined, 'ATIVA')
      .subscribe({
        next: (page) => {
          this.obras = page.content || [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  selectObra(obra: ObraResponseDTO) {
    this.obraSelected.emit(obra);
    this.close();
  }
}
