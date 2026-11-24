import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obterUsuarioAtual } from "@/app/actions/login";
import Register from "@/app/src/componentes/Register";

async function ConteudoRegister() {
  await connection();
  const usuario = await obterUsuarioAtual();

  if (usuario) {
    redirect("/");
  }

  return <Register />;
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6FBFF]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
        </div>
      }
    >
      <ConteudoRegister />
    </Suspense>
  );
}
