"use client";

import { NgoPostHeader } from "@/components/ngo/ngo-post-header";
import Link from "next/link";
import type { ReactNode } from "react";
import { PostMediaCarousel } from "./post-media-carousel";

type OrganizationPostProps = {
  organization: { name: string; nickname: string; logoUrl: string | null };
  /** Public organization profile; makes the header a link when present. */
  organizationHref?: string;
  body: string;
  tags: string[];
  mediaUrls: string[];
  createdAt: string;
  isEdited: boolean;
  /** Controls beside the like button, such as the like button itself. */
  actions?: ReactNode;
  /** Header action, such as a menu. */
  headerAction?: ReactNode;
  onPhotoDoubleTap?: () => void;
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Standalone organization post presentation, matching the Home feed style. */
export function OrganizationPost({
  organization,
  organizationHref,
  body,
  tags,
  mediaUrls,
  createdAt,
  isEdited,
  actions,
  headerAction,
  onPhotoDoubleTap,
}: OrganizationPostProps) {
  const header = (
    <NgoPostHeader
      compact
      name={organization.name}
      nickname={organization.nickname}
      logoUrl={organization.logoUrl}
      action={headerAction}
    />
  );
  return (
    <article
      aria-label={`Publicação de ${organization.name}`}
      className="flex min-w-0 flex-col gap-2 bg-white pb-3 text-text"
    >
      {organizationHref ? (
        <Link
          href={organizationHref}
          className="block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-tertiary"
        >
          {header}
        </Link>
      ) : (
        header
      )}
      {mediaUrls.length ? (
        <PostMediaCarousel
          post={{ media: mediaUrls.map((url) => ({ url, type: "image" })) }}
          petName={null}
          tone="bg-secondary"
          edgeToEdge
          showTag={false}
          onPhotoDoubleTap={onPhotoDoubleTap}
        />
      ) : null}
      {actions ? (
        <div className="flex items-center gap-3 px-4">{actions}</div>
      ) : null}
      <p className="px-4 text-sm leading-relaxed break-words whitespace-pre-line">
        {body}
      </p>
      {tags.length ? (
        <ul aria-label="Marcadores" className="flex flex-wrap gap-2 px-4">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold"
            >
              #{tag}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="px-4 text-xs text-neutral-600">
        <time dateTime={createdAt}>
          {dateFormat.format(new Date(createdAt))}
        </time>
        {isEdited ? " · editada" : null}
      </p>
    </article>
  );
}
