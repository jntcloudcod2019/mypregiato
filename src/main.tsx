import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'

// NOTA: Em produção, você precisará configurar a VITE_CLERK_PUBLISHABLE_KEY
// Por enquanto usando uma chave placeholder para desenvolvimento
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder";

if (!PUBLISHABLE_KEY) {
  throw new Error("Chave Clerk não encontrada. Configure VITE_CLERK_PUBLISHABLE_KEY");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);