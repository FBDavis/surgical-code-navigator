-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation participants table
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message attachments table for linking cases/codes
CREATE TABLE public.message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL, -- 'case' or 'code'
  attachment_id UUID NOT NULL, -- case_id or case_code_id
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Conversation creators can update their conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = created_by);

-- RLS Policies for conversation participants
CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Conversation creators can manage participants"
ON public.conversation_participants
FOR ALL
USING (
  conversation_id IN (
    SELECT id 
    FROM public.conversations 
    WHERE created_by = auth.uid()
  )
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for message attachments
CREATE POLICY "Users can view attachments in their conversations"
ON public.message_attachments
FOR SELECT
USING (
  message_id IN (
    SELECT m.id 
    FROM public.messages m
    JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create attachments for their messages"
ON public.message_attachments
FOR INSERT
WITH CHECK (
  message_id IN (
    SELECT id 
    FROM public.messages 
    WHERE user_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for conversation participants
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;