import { Route, Routes } from "react-router";
import Template from "../template";
import PaginaExemplo from "../App/PaginaExemplo";
import Home from "../App/Home";
import Login from "../App/Login";

export function ApplicationRoutes() {
  return (
    <Routes>
      <Route element={<Template />}>
        {/* o asterisco representa qualquer rota digitada que não esteja cadastrada aqui, se uma rota digitada no navegador não existir, a aplicação vai para home */}
        <Route path="*" element={<Home />}/>
        {/* path  é o caminho da url e element é o componente vinculado a essa rota */}
        <Route path="/" element={<Home />}/>
        <Route path="/exemplo" element={<PaginaExemplo />} />
      </Route>
    </Routes>
  )
}

export function LoginRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />}/>
    </Routes>
  )
}