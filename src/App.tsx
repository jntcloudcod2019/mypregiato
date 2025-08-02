import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/main-layout";
import Dashboard from "./pages/dashboard";
import Contratos from "./pages/contratos";
import ContratosAgenciamento from "./pages/contratos/agenciamento";
import NovoContratoAgenciamento from "./pages/contratos/agenciamento/novo";
import NovoContratoSuperFotos from "./pages/contratos/novo-contrato-super-fotos";
import NovoContratoSuperFotosMenor from "./pages/contratos/super-fotos-menor";
import NovoContratoAgenciamentoMenor from "./pages/contratos/agenciamento-menor";
import NovoContratoComprometimento from "./pages/contratos/comprometimento";
import Talentos from "./pages/talentos";
import NovoTalento from "./pages/talentos/novo";
import TalentProfile from "./pages/talentos/perfil/[id]";
import Financas from "./pages/financas";
import Usuarios from "./pages/usuarios";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contratos" element={<Contratos />} />
        <Route path="/contratos/agenciamento" element={<ContratosAgenciamento />} />
        <Route path="/contratos/agenciamento/novo" element={<NovoContratoAgenciamento />} />
        <Route path="/contratos/novo-super-fotos" element={<NovoContratoSuperFotos />} />
        <Route path="/contratos/super-fotos-menor" element={<NovoContratoSuperFotosMenor />} />
        <Route path="/contratos/agenciamento-menor" element={<NovoContratoAgenciamentoMenor />} />
        <Route path="/contratos/comprometimento" element={<NovoContratoComprometimento />} />
        <Route path="/talentos" element={<Talentos />} />
        <Route path="/talentos/novo" element={<NovoTalento />} />
        <Route path="/talentos/perfil/:id" element={<TalentProfile />} />
        <Route path="/financas" element={<Financas />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  </BrowserRouter>
);

export default App;