import { Suspense } from "react";
import { connection } from "next/server";
import { obterUsuarioAtual } from "@/app/actions/login";
import AbaAvaliacao from "./src/pages/AbaAvaliacao";
import Login from "./src/componentes/Login";

async function ConteudoHome() {
  await connection();
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    return <Login />;
  }

  return <AbaAvaliacao usuarioInicial={usuario} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6FBFF]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
        </div>
      }
    >
      <ConteudoHome />
    </Suspense>
  );
}
