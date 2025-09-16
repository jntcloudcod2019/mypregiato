import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import MainLayout from "./components/layout/main-layout";
import { ProtectedRoute } from "./components/auth/protected-route";
import { AuthGuard } from "./components/auth/auth-guard";
import { AuthInitializer } from "./components/auth/auth-initializer";
import { AutoLogout } from "./components/auth/auto-logout";
import LoginPage from "./pages/login";
import Dashboard from "./pages/dashboard";
import CRMDashboard from "./pages/crm/dashboard";
import CRMWorkspace from "./pages/crm/workspace";
import ImportarDadosPage from "./pages/crm/importar";
import AlocacaoLeadsPage from "./pages/crm/importar/alocacao-leads";
import LeadsPage from "./pages/crm/leads";
import NovoLead from "./pages/crm/leads/novo";
import DetalheLead from "./pages/crm/leads/[id]";
import LeadsKanban from "./pages/crm/leads/kanban";
import EventosPage from "./pages/crm/eventos";
import TarefasPage from "./pages/crm/tarefas";
import NovaTarefa from "./pages/crm/tarefas/nova";
import RelatoriosPage from "./pages/crm/relatorios";
import ConfiguracoesPage from "./pages/crm/configuracoes";
import AtendimentoPage from "./pages/atendimento";
import HistoricoChatsPage from "./pages/atendimento/historico";
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
import NotFound from "./pages/NotFound";
import ModulePage from "./pages/modules/slug";
import FichaDigitalPage from "./pages/events/ficha/token";
import { WhatsAppProvider } from "./providers/whatsapp-provider";

// Componente para redirecionamento da raiz - sempre para login
const RootRedirect = () => {
  return <Navigate to="/login" replace />;
};

const App = () => (
  <BrowserRouter>
    <AuthInitializer>
      <AutoLogout>
        <AuthGuard>
          <WhatsAppProvider>
          <Routes>
        {/* Rotas públicas (não requerem autenticação) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/ficha/:token" element={<FichaDigitalPage />} />
        
        {/* Redirecionamento da raiz com verificação de autenticação */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Rotas protegidas - requerem autenticação */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/apps/:slug" element={
          <ProtectedRoute>
            <MainLayout>
              <ModulePage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Rotas CRM */}
        <Route path="/crm" element={
          <ProtectedRoute>
            <MainLayout>
              <CRMWorkspace />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/importar" element={
          <ProtectedRoute>
            <MainLayout>
              <ImportarDadosPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/crm/importar/alocacao-leads" element={
          <ProtectedRoute>
            <MainLayout>
              <AlocacaoLeadsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/leads" element={
          <ProtectedRoute>
            <MainLayout>
              <LeadsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/leads/kanban" element={
          <ProtectedRoute>
            <MainLayout>
              <LeadsKanban />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/leads/novo" element={
          <ProtectedRoute>
            <MainLayout>
              <NovoLead />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/leads/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <DetalheLead />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/leads/:id/editar" element={
          <ProtectedRoute>
            <MainLayout>
              <NovoLead />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/tarefas" element={
          <ProtectedRoute>
            <MainLayout>
              <TarefasPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/tarefas/nova" element={
          <ProtectedRoute>
            <MainLayout>
              <NovaTarefa />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/relatorios" element={
          <ProtectedRoute>
            <MainLayout>
              <RelatoriosPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/configuracoes" element={
          <ProtectedRoute>
            <MainLayout>
              <ConfiguracoesPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm/eventos" element={
          <ProtectedRoute>
            <MainLayout>
              <EventosPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/configuracoes" element={
          <ProtectedRoute>
            <MainLayout>
              <ConfiguracoesPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Rotas de atendimento */}
        <Route path="/atendimento" element={
          <ProtectedRoute>
            <MainLayout>
              <AtendimentoPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/atendimento/historico" element={
          <ProtectedRoute>
            <MainLayout>
              <HistoricoChatsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Rotas de treinamento */}
        <Route path="/treinamentos" element={
          <ProtectedRoute>
            <MainLayout>
              <TreinamentosPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/treinamentos/criar" element={
          <ProtectedRoute>
            <MainLayout>
              <CriarTreinamentoPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/treinamentos/curso/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <CursoPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Rotas de ponto eletrônico */}
        <Route path="/ponto" element={
          <ProtectedRoute>
            <MainLayout>
              <PontoEletronicoPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Rotas de contratos */}
        <Route path="/contratos" element={
          <ProtectedRoute>
            <MainLayout>
              <Contratos />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/contratos/agenciamento" element={
          <ProtectedRoute>
            <MainLayout>
              <ContratosAgenciamento />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/contratos/agenciamento/novo" element={
          <ProtectedRoute>
            <MainLayout>
              <NovoContratoAgenciamento />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/contratos/novo-super-fotos" element={
          <ProtectedRoute>
            <MainLayout>
              <NovoContratoSuperFotos />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/contratos/super-fotos-menor" element={
          <ProtectedRoute>
            <MainLayout>
              <NovoContratoSuperFotosMenor />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/contratos/agenciamento-menor" element={
          <ProtectedRoute>
            <MainLayout>
              <NovoContratoAgenciamentoMenor />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/contratos/comprometimento" element={
          <ProtectedRoute>
            <MainLayout>
              <NovoContratoComprometimento />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Rotas de talentos */}
        <Route path="/talentos" element={
          <ProtectedRoute>
            <MainLayout>
              <Talentos />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/talentos/novo" element={
          <ProtectedRoute>
            <MainLayout>
              <NovoTalento />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/talentos/perfil/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <TalentProfile />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Rotas administrativas */}
        <Route path="/financas" element={
          <ProtectedRoute>
            <MainLayout>
              <Financas />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/usuarios" element={
          <ProtectedRoute>
            <MainLayout>
              <Usuarios />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Rota 404 - redireciona para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
          </WhatsAppProvider>
        </AuthGuard>
      </AutoLogout>
    </AuthInitializer>
  </BrowserRouter>
);

export default App;