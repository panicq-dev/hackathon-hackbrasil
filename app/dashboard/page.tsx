import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obterUsuarioAtual } from "@/app/actions/login";
import DashboardView from "./DashboardView";

async function ConteudoDashboard() {
  await connection();
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    redirect("/login");
  }

  return <DashboardView usuario={usuario} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoDashboard />
    </Suspense>
  );
}
