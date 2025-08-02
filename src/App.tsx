import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
