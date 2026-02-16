"use client";

import {
  CmdOrOption,
  KeyboardShortcut,
} from "@/components/nowts/keyboard-shortcut";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { globalSearchAction } from "@/features/search/search.action";
import { useDebounceFn } from "@/hooks/use-debounce-fn";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  Bell,
  Briefcase,
  CalendarCheck,
  CalendarClock,
  Kanban,
  ListOrdered,
  Users,
  UserCircle,
  Globe,
  FileText,
  Mail,
  Receipt,
  BarChart3,
  Settings,
  Plus,
  Search,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type CommandPage = {
  label: string;
  href: string;
  icon: typeof CalendarCheck;
  shortcut?: string;
};

const PAGES: CommandPage[] = [
  { label: "Today", href: "/app", icon: CalendarCheck, shortcut: "T" },
  { label: "Pipeline", href: "/app/pipeline", icon: Kanban, shortcut: "P" },
  { label: "Contacts", href: "/app/contacts", icon: Users, shortcut: "C" },
  { label: "Relances", href: "/app/follow-ups", icon: CalendarClock },
  { label: "Séquences", href: "/app/sequences", icon: ListOrdered },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { label: "Templates", href: "/app/templates", icon: FileText },
  { label: "Profils", href: "/app/profiles", icon: UserCircle },
  { label: "CV Lab", href: "/app/cv-lab", icon: FileText },
  { label: "Emails", href: "/app/emails", icon: Mail },
  { label: "Plateformes", href: "/app/platforms", icon: Globe },
  { label: "Facturation", href: "/freelance", icon: Receipt },
  { label: "Notifications", href: "/app/notifications", icon: Bell },
  { label: "Parametres", href: "/account", icon: Settings },
];

type CommandAction = {
  label: string;
  href: string;
  icon: typeof Plus;
};

const QUICK_ACTIONS: CommandAction[] = [
  { label: "Nouvelle mission", href: "/app/pipeline", icon: Plus },
  { label: "Nouveau contact", href: "/app/contacts", icon: UserPlus },
  { label: "Nouvelle relance", href: "/app/pipeline", icon: Bell },
];

type SearchResults = {
  missions: {
    id: string;
    title: string;
    company: string | null;
    status: string;
  }[];
  contacts: {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
  }[];
};

export function AppCommand() {
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useHotkeys("mod+k", toggleOpen);

  // Vim-style "go to" shortcuts
  useHotkeys("g t", () => router.push("/app"), { preventDefault: true });
  useHotkeys("g p", () => router.push("/app/pipeline"), {
    preventDefault: true,
  });
  useHotkeys("g c", () => router.push("/app/contacts"), {
    preventDefault: true,
  });
  useHotkeys("g a", () => router.push("/app/analytics"), {
    preventDefault: true,
  });
  useHotkeys("g r", () => router.push("/app/follow-ups"), {
    preventDefault: true,
  });
  useHotkeys("g s", () => router.push("/app/sequences"), {
    preventDefault: true,
  });
  useHotkeys("g v", () => router.push("/app/cv-lab"), {
    preventDefault: true,
  });

  const runCommand = useCallback(
    (href: string) => {
      setOpen(false);
      setSearchResults(null);
      router.push(href);
    },
    [router],
  );

  const debouncedSearch = useDebounceFn(async (value: string) => {
    setIsSearching(true);
    try {
      const result = await resolveActionResult(
        globalSearchAction({ query: value }),
      );
      setSearchResults(result);
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleSearch = useCallback(
    (value: string) => {
      if (value.length < 2) {
        setSearchResults(null);
        return;
      }
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  const hasSearchResults =
    searchResults &&
    (searchResults.missions.length > 0 || searchResults.contacts.length > 0);

  return (
    <>
      <div className="relative w-full">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
        <Input
          type="search"
          placeholder="Chercher..."
          className="bg-background w-full appearance-none pl-8 shadow-none"
          onClick={() => {
            setOpen(true);
          }}
        />

        <div className="pointer-events-none absolute top-2.5 right-2.5 inline-flex h-5 items-center gap-1 select-none">
          <KeyboardShortcut eventKey="cmd">
            <CmdOrOption />
          </KeyboardShortcut>
          <KeyboardShortcut eventKey="k">K</KeyboardShortcut>
        </div>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Chercher une page, une action ou un élément..."
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Recherche...</span>
              </div>
            ) : (
              "Aucun resultat."
            )}
          </CommandEmpty>
          {hasSearchResults ? (
            <>
              {searchResults.missions.length > 0 ? (
                <CommandGroup heading="Missions">
                  {searchResults.missions.map((mission) => (
                    <CommandItem
                      key={mission.id}
                      value={`mission-${mission.title}-${mission.company ?? ""}`}
                      onSelect={() =>
                        runCommand(`/app/pipeline?missionId=${mission.id}`)
                      }
                    >
                      <Briefcase className="mr-2 size-4" />
                      <span>{mission.title}</span>
                      {mission.company ? (
                        <span className="text-muted-foreground ml-2 text-sm">
                          {mission.company}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {searchResults.contacts.length > 0 ? (
                <CommandGroup heading="Contacts">
                  {searchResults.contacts.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      value={`contact-${contact.firstName}-${contact.lastName}-${contact.company ?? ""}`}
                      onSelect={() =>
                        runCommand(`/app/contacts?contactId=${contact.id}`)
                      }
                    >
                      <Users className="mr-2 size-4" />
                      <span>
                        {contact.firstName} {contact.lastName}
                      </span>
                      {contact.company ? (
                        <span className="text-muted-foreground ml-2 text-sm">
                          {contact.company}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </>
          ) : null}
          <CommandGroup heading="Pages">
            {PAGES.map((page) => (
              <CommandItem
                key={page.href}
                onSelect={() => runCommand(page.href)}
              >
                <page.icon className="mr-2 size-4" />
                <span>{page.label}</span>
                {page.shortcut ? (
                  <CommandShortcut>{page.shortcut}</CommandShortcut>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions rapides">
            {QUICK_ACTIONS.map((action) => (
              <CommandItem
                key={action.label}
                onSelect={() => runCommand(action.href)}
              >
                <action.icon className="mr-2 size-4" />
                <span>{action.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
