-- ── Threads ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_threads (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                 uuid        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  created_by_participant_id uuid      REFERENCES trip_participants(id) ON DELETE SET NULL,
  title                   text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  -- Optional link to an app element (denormalized for fast reads)
  linked_type             text        CHECK (linked_type IN ('activity','expense','packlist_item','shopping_item')),
  linked_id               uuid,
  linked_title            text,
  linked_subtitle         text,
  linked_emoji            text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_threads_trip ON group_threads (trip_id, created_at DESC);

-- ── Messages ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_messages (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id      uuid        NOT NULL REFERENCES group_threads(id) ON DELETE CASCADE,
  trip_id        uuid        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  participant_id uuid        REFERENCES trip_participants(id) ON DELETE SET NULL,
  content        text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_messages_thread ON group_messages (thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS group_messages_trip   ON group_messages (trip_id, created_at DESC);

-- ── Reactions ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS message_reactions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id     uuid        NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  participant_id uuid        NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  emoji          text        NOT NULL CHECK (char_length(emoji) <= 10),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, participant_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE group_threads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Threads
CREATE POLICY threads_select ON group_threads FOR SELECT
  USING (user_is_trip_participant(trip_id));

CREATE POLICY threads_insert ON group_threads FOR INSERT
  WITH CHECK (
    user_is_trip_participant(trip_id)
    AND created_by_participant_id IN (
      SELECT id FROM trip_participants
      WHERE trip_id = group_threads.trip_id AND user_id = auth.uid() AND NOT is_group
    )
  );

CREATE POLICY threads_delete ON group_threads FOR DELETE
  USING (
    created_by_participant_id IN (
      SELECT id FROM trip_participants WHERE user_id = auth.uid()
    )
  );

-- Messages
CREATE POLICY messages_select ON group_messages FOR SELECT
  USING (user_is_trip_participant(trip_id));

CREATE POLICY messages_insert ON group_messages FOR INSERT
  WITH CHECK (
    user_is_trip_participant(trip_id)
    AND participant_id IN (
      SELECT id FROM trip_participants
      WHERE trip_id = group_messages.trip_id AND user_id = auth.uid() AND NOT is_group
    )
  );

CREATE POLICY messages_delete ON group_messages FOR DELETE
  USING (
    participant_id IN (
      SELECT id FROM trip_participants WHERE user_id = auth.uid()
    )
  );

-- Reactions
CREATE POLICY reactions_select ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_messages m
      WHERE m.id = message_id AND user_is_trip_participant(m.trip_id)
    )
  );

CREATE POLICY reactions_insert ON message_reactions FOR INSERT
  WITH CHECK (
    participant_id IN (
      SELECT tp.id FROM trip_participants tp
      JOIN group_messages m ON m.id = message_id
      WHERE tp.trip_id = m.trip_id AND tp.user_id = auth.uid() AND NOT tp.is_group
    )
  );

CREATE POLICY reactions_delete ON message_reactions FOR DELETE
  USING (
    participant_id IN (
      SELECT id FROM trip_participants WHERE user_id = auth.uid()
    )
  );

-- ── Realtime ──────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE group_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
