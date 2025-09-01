import { ApplicationRoutes, LoginRoutes } from "./Routes"

export default function RouterDecider() {
  // Esse componente decide quais rotas serão usadas
  // Se o usuário está logado, ele mostra as rotas da aplicação
  // Se não, ele mostra as rotas de login, registrar, etc

  // Essa variável está como true para teste, mas ela vai buscar o usuário dos cookies, por exemplo
  const user = true

  return (
    <>
      {user ? <ApplicationRoutes /> : <LoginRoutes />}
    </>
  )
}