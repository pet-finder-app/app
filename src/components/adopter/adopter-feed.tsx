"use client";

import { Button, Card, cn } from "@/components/ui";
import { UserCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

type FeedTabsProps = {
  recommended: ReactNode;
  following: ReactNode;
  followingCount: number;
};

/** Recommended and followed-NGO feed tabs. */
export function AdopterFeedTabs({
  recommended,
  following,
  followingCount,
}: FeedTabsProps) {
  const [tab, setTab] = useState<"recommended" | "following">("recommended");
  const tabs = [
    { id: "recommended", label: "Recomendações" },
    { id: "following", label: `Seguindo (${followingCount})` },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Feed de pets"
        className="flex border-b border-border-light bg-white px-3"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`feed-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`feed-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 flex-1 border-b-2 px-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-accent-tertiary",
              tab === t.id
                ? "border-text text-text"
                : "border-transparent text-neutral-600 hover:text-text",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`feed-panel-${tab}`}
        aria-labelledby={`feed-tab-${tab}`}
      >
        {tab === "recommended" ? recommended : following}
      </div>
    </div>
  );
}

/** Toggle following an NGO. */
export function FollowButton({
  ngoId,
  ngoName,
  following,
  showHint = false,
}: {
  ngoId: string;
  ngoName: string;
  following: boolean;
  /** Show an unfollow hint while the NGO is followed. */
  showHint?: boolean;
}) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(following);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const response = await fetch(`/api/ngos/${ngoId}/follow`, {
        method: "POST",
      });
      if (response.ok) {
        const data = (await response.json()) as { following: boolean };
        setIsFollowing(data.following);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={isFollowing ? "outline" : "primary"}
        size="sm"
        disabled={busy}
        aria-pressed={isFollowing}
        onClick={() => void toggle()}
      >
        {isFollowing ? (
          <UserCheck className="size-4" aria-hidden="true" />
        ) : (
          <UserPlus className="size-4" aria-hidden="true" />
        )}
        {isFollowing ? "Seguindo" : "Seguir"}
        <span className="sr-only"> {ngoName}</span>
      </Button>
      {showHint && isFollowing ? (
        <p className="text-xs text-neutral-600">
          Toque de novo para deixar de seguir.
        </p>
      ) : null}
    </div>
  );
}

/** Empty-state message for a feed tab. */
export function FeedEmpty({ children }: { children: ReactNode }) {
  return (
    <Card className="items-center gap-2 text-center">
      <p className="text-sm text-neutral-600">{children}</p>
    </Card>
  );
}
