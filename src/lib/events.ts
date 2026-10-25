import { findById } from "@/lib/db/crud";
import { findEventBySlug } from "@/lib/db/models/events";

export type EventRecord = {
  id: string;
  name?: string;
  votePrice?: number;
  published: boolean;
  archived: boolean;
  blocked: boolean;
  status: string;
};

export function isEventVotingAllowed(event: EventRecord): boolean {
  return event.published && !event.archived && !event.blocked;
}

export function isEventTicketingAllowed(event: EventRecord): boolean {
  return event.published && !event.archived && !event.blocked;
}

export function getEventBlockReason(event: EventRecord): string | null {
  if (!event.published) return "Cet événement n'est pas encore publié.";
  if (event.archived) return "Cet événement est archivé.";
  if (event.blocked) return "Les votes et achats sont temporairement suspendus pour cet événement.";
  return null;
}

export async function getEventForVoting(eventId: string) {
  const event = await findById<EventRecord>("event", eventId);
  if (!event) return { event: null, error: "Événement introuvable" as const };
  const blockReason = getEventBlockReason(event);
  if (blockReason) return { event: null, error: blockReason };
  return { event, error: null };
}

export async function getEventForTicketing(eventId: string) {
  return getEventForVoting(eventId);
}

export async function getEventBySlugForPublic(slug: string) {
  return findEventBySlug(slug, true);
}
