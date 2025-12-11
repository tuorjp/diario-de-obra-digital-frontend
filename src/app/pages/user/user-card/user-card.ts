import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {HefCardComponent} from "../../../shared/ui/hef-card/hef-card.component";
import {UserRegisterDto} from '../../../utils/dto/UserRegisterDto';

@Component({
  selector: 'app-user-card',
  imports: [
      HefCardComponent
  ],
  standalone: true,
  templateUrl: './user-card.html',
  styleUrl: './user-card.css'
})
export class UserCard {
  @Input() user: UserRegisterDto | null = null;
  @Output() editClicked = new EventEmitter<UserRegisterDto>();

  onEditProfile = () => {
    if (this.user) {
      this.editClicked.emit(this.user);
    }
  }
}
