import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/main-layout";
import Dashboard from "./pages/dashboard";
import CRMDashboard from "./pages/crm/dashboard";
import LeadsPage from "./pages/crm/leads";
import NovoLead from "./pages/crm/leads/novo";
import DetalheLead from "./pages/crm/leads/[id]";
import TarefasPage from "./pages/crm/tarefas";
import NovaTarefa from "./pages/crm/tarefas/nova";
import RelatoriosPage from "./pages/crm/relatorios";
import ConfiguracoesPage from "./pages/crm/configuracoes";
import AtendimentoPage from "./pages/atendimento";
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
import TreinamentosPage from "./pages/treinamentos";
import CriarTreinamentoPage from "./pages/treinamentos/criar";
import CursoPage from "./pages/treinamentos/curso/[id]";
import PontoEletronicoPage from "./pages/ponto";
import ApiTesterPage from "./pages/api-tester";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/crm" element={<CRMDashboard />} />
        <Route path="/crm/leads" element={<LeadsPage />} />
        <Route path="/crm/leads/novo" element={<NovoLead />} />
        <Route path="/crm/leads/:id" element={<DetalheLead />} />
        <Route path="/crm/leads/:id/editar" element={<NovoLead />} />
        <Route path="/crm/tarefas" element={<TarefasPage />} />
        <Route path="/crm/tarefas/nova" element={<NovaTarefa />} />
        <Route path="/crm/relatorios" element={<RelatoriosPage />} />
        <Route path="/crm/configuracoes" element={<ConfiguracoesPage />} />
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
        <Route path="/atendimento" element={<AtendimentoPage />} />
        <Route path="/treinamentos" element={<TreinamentosPage />} />
        <Route path="/treinamentos/criar" element={<CriarTreinamentoPage />} />
        <Route path="/treinamentos/curso/:id" element={<CursoPage />} />
        <Route path="/ponto" element={<PontoEletronicoPage />} />
        <Route path="/api-tester" element={<ApiTesterPage />} />
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