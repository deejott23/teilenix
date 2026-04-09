-- ── Group Messages ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_messages (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           uuid        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  participant_id    uuid        REFERENCES trip_participants(id) ON DELETE SET NULL,
  content           text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  -- Optional linked app element (denormalized for fast reads)
  linked_type       text        CHECK (linked_type IN ('activity', 'expense', 'packlist_item', 'shopping_item')),
  linked_id         uuid,
  linked_title      text,
  linked_subtitle   text,
  linked_emoji      text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_messages_trip_created
  ON group_messages (trip_id, created_at DESC);

-- ── Message Reactions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS message_reactions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id     uuid        NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  participant_id uuid        NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  emoji          text        NOT NULL CHECK (char_length(emoji) <= 10),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, participant_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE group_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Messages: trip participants can read all, post their own
CREATE POLICY msg_select ON group_messages FOR SELECT
  USING (user_is_trip_participant(trip_id));

CREATE POLICY msg_insert ON group_messages FOR INSERT
  WITH CHECK (
    user_is_trip_participant(trip_id)
    AND participant_id IN (
      SELECT id FROM trip_participants
      WHERE trip_id = group_messages.trip_id
        AND user_id = auth.uid()
        AND NOT is_group
    )
  );

CREATE POLICY msg_delete ON group_messages FOR DELETE
  USING (
    participant_id IN (
      SELECT id FROM trip_participants
      WHERE trip_id = group_messages.trip_id
        AND user_id = auth.uid()
    )
  );

-- Reactions: trip participants can manage their own
CREATE POLICY react_select ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_messages m
      WHERE m.id = message_id
        AND user_is_trip_participant(m.trip_id)
    )
  );

CREATE POLICY react_insert ON message_reactions FOR INSERT
  WITH CHECK (
    participant_id IN (
      SELECT tp.id FROM trip_participants tp
      JOIN group_messages m ON m.id = message_id
      WHERE tp.trip_id = m.trip_id
        AND tp.user_id = auth.uid()
        AND NOT tp.is_group
    )
  );

CREATE POLICY react_delete ON message_reactions FOR DELETE
  USING (
    participant_id IN (
      SELECT id FROM trip_participants WHERE user_id = auth.uid()
    )
  );

-- ── Realtime ──────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
