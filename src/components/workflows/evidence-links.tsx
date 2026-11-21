import { FileText } from "lucide-react";
import Image from "next/image";
import { mediaIdHref } from "./labels";

type EvidenceLinksProps = {
  /** Go media ids. */
  ids: readonly string[];
  label: string;
  /** Follow-up photos show previews; surrender documents may be PDFs. */
  variant: "images" | "documents";
};

/** Private evidence stored in Go, opened through the authenticated proxy. */
export function EvidenceLinks({ ids, label, variant }: EvidenceLinksProps) {
  if (!ids.length) return null;
  if (variant === "images")
    return (
      <ul aria-label={label} className="grid grid-cols-3 gap-2">
        {ids.map((id, index) => (
          <li key={id}>
            <a
              href={mediaIdHref(id)}
              target="_blank"
              rel="noreferrer"
              className="relative block aspect-square overflow-hidden rounded-xl border border-stone-300 bg-neutral-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Image
                src={mediaIdHref(id)}
                alt={`${label}: foto ${index + 1}`}
                fill
                unoptimized
                sizes="120px"
                className="object-cover"
              />
            </a>
          </li>
        ))}
      </ul>
    );
  return (
    <ul aria-label={label} className="flex flex-col gap-1 text-sm">
      {ids.map((id, index) => (
        <li key={id} className="flex items-center gap-2">
          <FileText className="size-4 shrink-0" aria-hidden="true" />
          <a
            href={mediaIdHref(id)}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Documento {index + 1}
          </a>
        </li>
      ))}
    </ul>
  );
}
