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
  { label: "Dashboard", href: "/freelance", icon: BarChart3 },
  { label: "Factures", href: "/freelance/invoices", icon: Receipt },
  { label: "Devis", href: "/freelance/quotes", icon: FileClock },
  { label: "Clients", href: "/freelance/clients", icon: Users },
  { label: "Paiements", href: "/freelance/payments", icon: HandCoins },
  { label: "Dépenses - Factures", href: "/freelance/expenses/invoices", icon: Receipt },
  { label: "Dépenses - Notes de frais", href: "/freelance/expenses/expense-notes", icon: FileText },
  { label: "Dépenses - Trajets", href: "/freelance/expenses/trips", icon: FileText },
  { label: "Catalogue", href: "/freelance/catalog", icon: BookText },
  { label: "Registres", href: "/freelance/registers", icon: FileText },
  { label: "Logs", href: "/freelance/logs", icon: ClipboardList },
];

const QUICK_ACTIONS: CommandItemConfig[] = [
  { label: "Créer une facture", href: "/freelance/invoices?create=1", icon: Plus },
  { label: "Créer un devis", href: "/freelance/quotes?create=1", icon: Plus },
  { label: "Ajouter un client", href: "/freelance/clients?create=1", icon: Plus },
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
          className="bg-background pl-8 pr-12"
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
