"use client";

import { useEffect } from "react";
import { useSocket } from "./useSocket";
import { getSocket } from "@/lib/socket-client";

// ---- Event payload types ----

export interface AnnotationCreatedEvent {
  annotation: {
    id: string;
    groupId: string;
    userId: string;
    location: { item_id: string; start_offset: number; end_offset: number; highlighted_text: string };
    flawType: string;
    createdAt: string;
    isGroupAnswer: boolean;
    confirmedBy: string[];
  };
  sessionId: string;
}

export interface AnnotationDeletedEvent {
  annotationId: string;
  groupId: string;
  sessionId: string;
}

export interface AnnotationConfirmedEvent {
  annotationId: string;
  groupId: string;
  confirmedBy: string[];
  isGroupAnswer: boolean;
  sessionId: string;
}

export interface ScaffoldSentEvent {
  scaffold: {
    id: string;
    groupId: string;
    text: string;
    level: number;
    type: string;
    createdAt: string;
    acknowledgedAt: string | null;
  };
  sessionId: string;
}

export interface ScaffoldAcknowledgedEvent {
  scaffoldId: string;
  groupId: string;
  sessionId: string;
}

export interface PhaseChangedEvent {
  sessionId: string;
  from: string;
  to: string;
}

export interface UserConnectionEvent {
  userId: string;
  groupId: string | null;
  role: string;
  socketId: string;
}

export interface ConnectionRosterEntry {
  userId: string;
  groupId: string | null;
  role: string;
}

// ---- Hook ----

export interface SessionSocketHandlers {
  onAnnotationCreated?: (event: AnnotationCreatedEvent) => void;
  onAnnotationDeleted?: (event: AnnotationDeletedEvent) => void;
  onAnnotationConfirmed?: (event: AnnotationConfirmedEvent) => void;
  onScaffoldSent?: (event: ScaffoldSentEvent) => void;
  onScaffoldAcknowledged?: (event: ScaffoldAcknowledgedEvent) => void;
  onPhaseChanged?: (event: PhaseChangedEvent) => void;
  onUserConnected?: (event: UserConnectionEvent) => void;
  onUserDisconnected?: (event: UserConnectionEvent) => void;
  onConnectionRoster?: (roster: ConnectionRosterEntry[]) => void;
}

/**
 * Session-specific Socket.IO hook.
 * Wraps useSocket and subscribes to session/group events.
 *
 * @param sessionId - The session to join
 * @param groupId - The group to join (null for teachers)
 * @param handlers - Callbacks for each event type
 */
export function useSessionSocket(
  sessionId: string,
  groupId: string | null,
  handlers: SessionSocketHandlers
) {
  const { isConnected } = useSocket(sessionId, groupId);

  useEffect(() => {
    const socket = getSocket();

    // Map event names to handler functions
    const listeners: [string, (...args: unknown[]) => void][] = [];

    function on(event: string, handler: ((...args: unknown[]) => void) | undefined) {
      if (handler) {
        socket.on(event, handler);
        listeners.push([event, handler]);
      }
    }

    on("annotation:created", handlers.onAnnotationCreated as never);
    on("annotation:deleted", handlers.onAnnotationDeleted as never);
    on("annotation:confirmed", handlers.onAnnotationConfirmed as never);
    on("scaffold:sent", handlers.onScaffoldSent as never);
    on("scaffold:acknowledged", handlers.onScaffoldAcknowledged as never);
    on("session:phase_changed", handlers.onPhaseChanged as never);
    on("user:connected", handlers.onUserConnected as never);
    on("user:disconnected", handlers.onUserDisconnected as never);
    on("connection:roster", handlers.onConnectionRoster as never);

    return () => {
      for (const [event, handler] of listeners) {
        socket.off(event, handler);
      }
    };
    // Re-subscribe when handlers change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    handlers.onAnnotationCreated,
    handlers.onAnnotationDeleted,
    handlers.onAnnotationConfirmed,
    handlers.onScaffoldSent,
    handlers.onScaffoldAcknowledged,
    handlers.onPhaseChanged,
    handlers.onUserConnected,
    handlers.onUserDisconnected,
    handlers.onConnectionRoster,
  ]);

  return { isConnected };
}
