export interface EditUserDto {
  id: number;
  name: string;
  login: string;
  role: string;
  password?: string; // Opcional

  // Dados complementares
  cpf: string;
  crea: string;
  creaUf: string;
  phone1: string;
  phone2: string;

  // Endereço
  zipCode: string;
  address: string;
  addressNumber: string;
  complement: string;
  city: string;
  state: string;

  status?: string;
}
