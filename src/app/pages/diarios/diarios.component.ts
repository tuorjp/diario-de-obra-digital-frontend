import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-diarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diarios.component.html',
  styleUrls: ['./diarios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiariosComponent {
  diarios = [
    { id: 101, data: '10/02/2025', obra: 'Escola Municipal Nova Esperança', responsavel: 'Juliana Pires' },
    { id: 102, data: '11/02/2025', obra: 'UBS Setor Oeste', responsavel: 'Marcos Silva' },
    { id: 103, data: '12/02/2025', obra: 'Reforma Terminal Rodoviário', responsavel: 'Ana Martins' },
  ];
}
