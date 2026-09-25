import Boot from "@/components/Boot";

// Read-only box: /box?owner=0x… (static export, so the address rides in the query string). No owner = the builder's box.
export default function BoxPage() {
  return <Boot />;
}
