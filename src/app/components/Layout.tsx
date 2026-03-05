
import React from 'react';
import { ChefHat, Calendar, Search, Loader2, Settings, Calculator } from 'lucide-react';
import { Toaster } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <main className="">
        <div>
          {children}
        </div>
      </main>
      <Toaster position="top-center" richColors />
    </>
  );
};
