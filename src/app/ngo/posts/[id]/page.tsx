import { UnsupportedFeature } from "@/components/backend/unsupported-feature";
import { getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  return <UnsupportedFeature title="Publicação" />;
}
