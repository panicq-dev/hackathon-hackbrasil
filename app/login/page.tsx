import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obterUsuarioAtual } from "@/app/actions/login";
import Login from "@/app/src/componentes/Login";

async function ConteudoLogin() {
  await connection();
  const usuario = await obterUsuarioAtual();

  if (usuario) {
    redirect("/");
  }

  return <Login />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoLogin />
    </Suspense>
  );
}
