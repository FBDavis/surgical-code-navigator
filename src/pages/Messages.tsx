import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { TeamMessaging } from "@/components/TeamMessaging";

const Messages = () => {
  const [activeTab, setActiveTab] = useState('messages');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Handle navigation to other tabs if needed
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="container mx-auto px-4 py-8 md:ml-64">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Team Messages</h1>
            <p className="text-muted-foreground">
              Collaborate with your team and discuss cases and codes
            </p>
          </div>
          
          <TeamMessaging />
        </div>
      </main>
    </div>
  );
};

export default Messages;