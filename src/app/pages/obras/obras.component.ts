import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';

@Component({
  selector: 'app-obras',
  standalone: true,
  templateUrl: './obras.component.html',
  styleUrls: ['./obras.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgForOf,
    CommonModule
  ]
})
export class ObrasComponent {
  obras = [
    { id: 1, nome: 'Obra Escola Municipal Nova Esperança', cidade: 'Goiânia', status: 'Em andamento' },
    { id: 2, nome: 'Construção UBS Setor Oeste', cidade: 'Anápolis', status: 'Concluída' },
    { id: 3, nome: 'Reforma Terminal Rodoviário', cidade: 'Aparecida de Goiânia', status: 'Paralisada' },
  ];
}
