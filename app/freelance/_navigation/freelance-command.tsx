"use client";

import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  BookText,
  ClipboardList,
  FileClock,
  FileText,
  HandCoins,
  Plus,
  Receipt,
  Search,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type CommandItemConfig = {
  label: string;
  href: string;
  icon: typeof Receipt;
};

const NAV_ITEMS: CommandItemConfig[] = [
  { label: "Dashboard", href: "/job/gestion", icon: BarChart3 },
  { label: "Factures", href: "/job/gestion/invoices", icon: Receipt },
  { label: "Devis", href: "/job/gestion/quotes", icon: FileClock },
  { label: "Clients", href: "/job/gestion/clients", icon: Users },
  { label: "Paiements", href: "/job/gestion/payments", icon: HandCoins },
  {
    label: "Dépenses - Factures",
    href: "/job/gestion/expenses/invoices",
    icon: Receipt,
  },
  {
    label: "Dépenses - Notes de frais",
    href: "/job/gestion/expenses/expense-notes",
    icon: FileText,
  },
  {
    label: "Dépenses - Trajets",
    href: "/job/gestion/expenses/trips",
    icon: FileText,
  },
  { label: "Catalogue", href: "/job/gestion/catalog", icon: BookText },
  { label: "Registres", href: "/job/gestion/registers", icon: FileText },
  { label: "Logs", href: "/job/gestion/logs", icon: ClipboardList },
];

const QUICK_ACTIONS: CommandItemConfig[] = [
  {
    label: "Créer une facture",
    href: "/job/gestion/invoices?create=1",
    icon: Plus,
  },
  { label: "Créer un devis", href: "/job/gestion/quotes?create=1", icon: Plus },
  {
    label: "Ajouter un client",
    href: "/job/gestion/clients?create=1",
    icon: Plus,
  },
];

export function FreelanceCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const toggleOpen = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  useHotkeys("mod+k", toggleOpen, {
    enableOnFormTags: true,
    preventDefault: true,
  });

  const runCommand = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
        <Input
          type="search"
          placeholder="Recherche rapide..."
          className="bg-background pr-12 pl-8"
          onClick={() => {
            setOpen(true);
          }}
          readOnly
        />
        <span className="text-muted-foreground pointer-events-none absolute top-2.5 right-3 text-xs">
          ⌘K
        </span>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Naviguer ou lancer une action..." />
        <CommandList>
          <CommandGroup heading="Navigation">
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  runCommand(item.href);
                }}
              >
                <item.icon className="mr-2 size-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions rapides">
            {QUICK_ACTIONS.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  runCommand(item.href);
                }}
              >
                <item.icon className="mr-2 size-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
