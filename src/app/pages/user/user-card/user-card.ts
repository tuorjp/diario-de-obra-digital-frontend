import { Component } from '@angular/core';
import {HefCardComponent} from "../../../shared/ui/hef-card/hef-card.component";

@Component({
  selector: 'app-user-card',
    imports: [
        HefCardComponent
    ],
  templateUrl: './user-card.html',
  styleUrl: './user-card.css'
})
export class UserCard {
  onEditProfile() {
    console.log('Editar perfil clicado');
  }
}
