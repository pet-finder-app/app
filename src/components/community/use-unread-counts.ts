"use client";

import {
  conversationUnreadOptions,
  notificationUnreadOptions,
} from "@/lib/api/community";
import { useQuery } from "@tanstack/react-query";

/**
 * Unread notification and message totals for navigation badges. Polls every
 * minute; failures leave the badge hidden rather than inventing counts.
 */
export function useUnreadCounts() {
  const notifications = useQuery(notificationUnreadOptions());
  const conversations = useQuery(conversationUnreadOptions());
  return {
    notifications: notifications.data?.count ?? 0,
    messages: conversations.data?.unreadCount ?? 0,
  };
}
