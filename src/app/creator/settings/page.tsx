'use client';

import { CreatorLocationSettings } from '@/components/creator/CreatorLocationSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Settings, Bell, CreditCard } from 'lucide-react';
import { useDictionary } from '@/hooks/useDictionary';

export default function CreatorSettingsPage() {
  const dict = useDictionary();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          {dict.creatorSettings.title}
        </h1>
        <p className="text-muted-foreground">
          {dict.creatorSettings.subtitle}
        </p>
      </div>

      <Tabs defaultValue="location" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 text-sm whitespace-normal leading-tight">
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {dict.creatorSettings.tabs.location}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {dict.creatorSettings.tabs.notifications}
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {dict.creatorSettings.tabs.payments}
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {dict.creatorSettings.tabs.general}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="location">
          <CreatorLocationSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{dict.creatorSettings.tabs.notifications}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {dict.creatorSettings.soon}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>{dict.creatorSettings.tabs.payments}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {dict.creatorSettings.soon}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{dict.creatorSettings.tabs.general}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {dict.creatorSettings.soon}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}




