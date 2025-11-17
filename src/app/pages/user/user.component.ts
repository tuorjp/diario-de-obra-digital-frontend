import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  user = {
    nome: 'Juliana Evelyn Clarice Pires',
    funcao: 'Engenheiro',
    registroCrea: '5168415',
    ufCrea: 'Goiás',
    cpf: '046.659.785-44',
    email: 'juliana_evelyn@outlook.com',
    telefone1: '(62) 99988-7755',
    telefone2: '(62) 99988-7755',
    admissao: '02/02/2024',
    situacao: 'Trabalhando',
    endereco: 'Avenida Tancredo Neves',
    numero: 's/n',
    complemento: 'Bairro Vila A',
    cidade: 'Foz do Iguaçu',
    uf: 'Paraná',
    cep: '85866-000'
  };
}
