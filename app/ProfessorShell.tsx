'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { obterUsuarioAtual } from '@/app/actions/login';
import type { UsuarioSessao } from '@/app/src/lib/session';
import { DashboardChrome } from '@/app/dashboard/DashboardView';

export default function ProfessorShell({
  usuarioInicial,
  children,
}: {
  usuarioInicial: UsuarioSessao | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(
    usuarioInicial?.perfil === 'professor' ? usuarioInicial : null
  );

  useEffect(() => {
    let ativo = true;
    void obterUsuarioAtual()
      .then((sessao) => {
        if (ativo) setUsuario(sessao?.perfil === 'professor' ? sessao : null);
      })
      .catch((erro: unknown) => {
        console.error('Não foi possível verificar a sessão do professor durante a navegação:', erro);
      });

    return () => {
      ativo = false;
    };
  }, [pathname]);

  if (!usuario) return children;

  return (
    <DashboardChrome usuario={usuario} onLogout={() => setUsuario(null)}>
      {children}
    </DashboardChrome>
  );
}
