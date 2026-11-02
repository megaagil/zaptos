import { createFileRoute } from "@tanstack/react-router";
import { ZaptosApp } from "@/components/zaptos/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ZaptosApp />;
}
