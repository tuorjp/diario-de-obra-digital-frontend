import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'hef-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './hef-card.component.html',
  styleUrls: ['./hef-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HefCardComponent {

  @Input() title: string = '';

  @Input() actionLabel: string | null = null;

  @Input() actionIcon: string = 'edit';

  @Input() actionClick: (() => void) | undefined;
}
