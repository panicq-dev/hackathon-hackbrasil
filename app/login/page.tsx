import { Suspense } from "react";
import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/app/actions/login";
import Login from "@/app/src/componentes/Login";

async function ConteudoLogin() {
  const usuario = await obterUsuarioAtual();

  if (usuario) {
    redirect("/");
  }

  return <Login />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6FBFF]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
        </div>
      }
    >
      <ConteudoLogin />
    </Suspense>
  );
}
