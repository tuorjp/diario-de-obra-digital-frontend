import { Outlet } from "react-router";
import Header from '../components/HeaderExemplo/index';

export default function Template() {
  return (
    <div>
      {/* podemos importar e usar componentes dessa forma */}
      <Header />
      <div>Eu sempre apareço!, estou ao redor do outlet</div>
      {/* ISTO É UM COMENTÁRIO 
        A TAG abaixo (Outlet) representa o conteúdo de uma rota
        Por exemplo, se você estiver na rota /login, o componente vinculado a essa rota
        vai ser renderizado. Olhe o arquivo Routes.tsx para ver qual arquivo está vinculado
        a cada rota
      */}
      <Outlet />
    </div>
  )
}