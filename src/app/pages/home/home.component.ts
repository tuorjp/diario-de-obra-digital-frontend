import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  template: `<div>Sou a página home!</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
