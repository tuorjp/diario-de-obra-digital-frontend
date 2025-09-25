import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-pagina-exemplo',
  standalone: true,
  imports: [],
  template: `<div>Sou a página exemplo</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaExemploComponent {}
