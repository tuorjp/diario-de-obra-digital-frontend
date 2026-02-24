import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObraControllerService } from '../../../api/api/obraController.service';
import { ObraResponseDTO } from '../../../api/model/obraResponseDTO';

@Component({
  selector: 'app-obras',
  standalone: true,
  templateUrl: './obras.component.html',
  styleUrls: ['./obras.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ObrasComponent implements OnInit {
  private obraService = inject(ObraControllerService);

  obras = signal<ObraResponseDTO[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.obraService.search(0, 50, 'projeto', 'asc').subscribe({
      next: (page) => {
        console.log('[ObrasComponent] Resposta da API:', page);
        console.log('[ObrasComponent] content:', page.content);
        this.obras.set(page.content ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[ObrasComponent] Erro HTTP:', err);
        this.error.set(`Erro ao carregar obras: ${err.status} ${err.statusText ?? err.message}`);
        this.loading.set(false);
      },
    });
  }
}
