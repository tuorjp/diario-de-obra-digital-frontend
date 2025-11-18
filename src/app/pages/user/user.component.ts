import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HefCardComponent } from '../../shared/ui/hef-card/hef-card.component';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    HefCardComponent,
    MatButtonModule,
    CommonModule
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {

  onEditProfile() {
    console.log('Editar perfil clicado');
  }


}
