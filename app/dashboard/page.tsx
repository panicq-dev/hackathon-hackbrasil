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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6FBFF]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
        </div>
      }
    >
      <ConteudoDashboard />
    </Suspense>
  );
}
