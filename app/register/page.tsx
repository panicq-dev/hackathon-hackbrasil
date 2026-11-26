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
    <Suspense fallback={null}>
      <ConteudoRegister />
    </Suspense>
  );
}
