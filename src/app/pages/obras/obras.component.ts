import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-obras',
  standalone: true,
  templateUrl: './obras.component.html',
  styleUrls: ['./obras.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObrasComponent {
  obras = [
    { id: 1, nome: 'Obra Escola Municipal Nova Esperança', cidade: 'Goiânia', status: 'Em andamento' },
    { id: 2, nome: 'Construção UBS Setor Oeste', cidade: 'Anápolis', status: 'Concluída' },
    { id: 3, nome: 'Reforma Terminal Rodoviário', cidade: 'Aparecida de Goiânia', status: 'Paralisada' },
  ];
}
