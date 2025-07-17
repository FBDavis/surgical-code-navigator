import { useState, useEffect } from "react";
import { MessageSquare, Plus, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string;
  };
}

export function TeamMessaging() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newConversationName, setNewConversationName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading conversations:", error);
        toast({ title: "Error loading conversations", variant: "destructive" });
        return;
      }

      setConversations(data || []);
    };

    loadConversations();
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation)
        .order("created_at");

      if (messagesError) {
        console.error("Error loading messages:", messagesError);
        toast({ title: "Error loading messages", variant: "destructive" });
        return;
      }

      // Get user profiles for these messages
      const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        profilesData = data || [];
      }

      // Combine messages with profiles
      const messagesWithProfiles = messagesData?.map(message => ({
        ...message,
        profiles: profilesData.find(p => p.user_id === message.user_id)
      })) || [];

      setMessages(messagesWithProfiles);
    };

    loadMessages();

    // Subscribe to real-time message updates
    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const createConversation = async () => {
    if (!user || !newConversationName.trim()) return;

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        name: newConversationName,
        created_by: user.id,
      })
      .select()
      .single();

    if (conversationError) {
      toast({ title: "Error creating conversation", variant: "destructive" });
      return;
    }

    // Add creator as participant
    const { error: participantError } = await supabase
      .from("conversation_participants")
      .insert({
        conversation_id: conversation.id,
        user_id: user.id,
      });

    if (participantError) {
      toast({ title: "Error adding participant", variant: "destructive" });
      return;
    }

    setConversations([conversation, ...conversations]);
    setNewConversationName("");
    setIsCreateDialogOpen(false);
    toast({ title: "Conversation created successfully" });
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation,
        user_id: user.id,
        content: newMessage,
      });

    if (error) {
      toast({ title: "Error sending message", variant: "destructive" });
      return;
    }

    setNewMessage("");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please sign in to access team messaging.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="conversation-name">Conversation Name</Label>
                    <Input
                      id="conversation-name"
                      value={newConversationName}
                      onChange={(e) => setNewConversationName(e.target.value)}
                      placeholder="Enter conversation name"
                    />
                  </div>
                  <Button onClick={createConversation} className="w-full">
                    Create Conversation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                  selectedConversation === conversation.id ? "bg-muted" : ""
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <h4 className="font-medium">{conversation.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedConversation ? (
              <>
                <Users className="h-5 w-5" />
                {conversations.find(c => c.id === selectedConversation)?.name || "Conversation"}
              </>
            ) : (
              "Select a conversation"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedConversation ? (
            <div className="space-y-4">
              {/* Messages */}
              <ScrollArea className="h-[400px] space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {message.profiles?.display_name || "Unknown User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p>{message.content}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}