import React from "react";
import { SignIn } from "@clerk/clerk-react";
import Threads from "../ui/threads";

export default function CustomLogin() {

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <Threads
        color={[0.2, 0.4, 0.8]}
        amplitude={1.5}
        distance={0.3}
        enableMouseInteraction={true}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      />
      
      {/* Enhanced overlay for better contrast and readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/50 z-10"></div>
      
      {/* Login Form with improved visual hierarchy */}
      <div className="relative z-20 w-full max-w-md">
        <div className="backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/20 p-8">
          <SignIn 
            appearance={{
              elements: {
                headerTitle: "hidden",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105",
                card: "bg-transparent shadow-none",
                headerSubtitle: "text-slate-600 dark:text-slate-400",
                socialButtonsBlockButton: "border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200",
                formFieldInput: "border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200",
                footerActionLink: "text-blue-600 hover:text-blue-700 transition-colors duration-200"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}