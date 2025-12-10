import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Users, RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StaleContact {
  account_id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  city: string;
  last_contact_date: string | null;
  days_since_contact: number | null;
  waffling_score: number;
  decision_certainty: string;
  active_deals_count: number;
  active_deals_value: number;
  priority_score: number;
}

export function StaleContactsWidget() {
  const [contacts, setContacts] = useState<StaleContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchContacts = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("stale-contacts", {
        body: { days_threshold: 7 },
      });
      if (error) throw error;
      setContacts(data?.stale_contacts || []);
    } catch (err) {
      console.error("Failed to fetch stale contacts:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

  const getDaysLabel = (days: number | null) => {
    if (days === null) return "Never contacted";
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-warning" />
            Stale Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-warning" />
            Stale Contacts
            {contacts.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-warning/10 text-warning">
                {contacts.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchContacts(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All contacts are up to date!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.slice(0, 5).map((contact) => (
              <div
                key={contact.account_id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => navigate(`/accounts/${contact.account_id}`)}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{contact.company_name}</span>
                    {contact.decision_certainty === "at_risk" && (
                      <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.contact_name} • {contact.city}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getDaysLabel(contact.days_since_contact)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {contact.active_deals_count > 0 && (
                    <>
                      <p className="text-sm font-medium">{formatCurrency(contact.active_deals_value)}</p>
                      <p className="text-xs text-muted-foreground">
                        {contact.active_deals_count} proposal{contact.active_deals_count !== 1 ? "s" : ""}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
