import { BrowserRouter } from "react-router";
import RouterDecider from "./routes/RouterDecider";

 export default function App() {
  // Esse é o componente de entrada
  // Ele leva a aplicação para o RouterDecider

  return (
    <BrowserRouter>
      <RouterDecider />
    </BrowserRouter>
  )
}
