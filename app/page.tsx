import { Suspense } from "react";
import { connection } from "next/server";
import { obterUsuarioAtual } from "@/app/actions/login";
import DashboardView from "./dashboard/DashboardView";
import Login from "./src/componentes/Login";

async function ConteudoHome() {
  await connection();
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    return <Login />;
  }

  return <DashboardView usuario={usuario} />;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <ConteudoHome />
    </Suspense>
  );
}
