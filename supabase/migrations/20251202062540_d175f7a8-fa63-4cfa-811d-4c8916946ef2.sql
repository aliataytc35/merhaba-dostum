-- Fix critical RLS policy bugs in conversations tables

-- 1. Fix conversations SELECT policy
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- 2. Fix conversation_participants SELECT policy
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
CREATE POLICY "Users can view conversation participants" ON conversation_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

-- 3. Fix conversation_participants INSERT policy to prevent unauthorized additions
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;
CREATE POLICY "Users can add participants" ON conversation_participants FOR INSERT WITH CHECK (
  -- Allow if user is already a participant in this conversation, OR if it's a new conversation
  auth.uid() IN (
    SELECT user_id FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id
  )
  OR NOT EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id
  )
);