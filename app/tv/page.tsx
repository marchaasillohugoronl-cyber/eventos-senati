import { TvScreen } from "@/components/television/TvScreen";

export const dynamic = "force-dynamic";
export const metadata = { title: "TV · SENATI" };

export default function TvPage({ searchParams }: { searchParams: { key?: string } }) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  return <TvScreen tvKey={searchParams.key} appUrl={appUrl} />;
}
