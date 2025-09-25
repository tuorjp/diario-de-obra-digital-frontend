import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  template: `<h1>Sou o header!</h1>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}
