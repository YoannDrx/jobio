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
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Bell, Globe, Plus, Search, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { APP_LINKS } from "./app-navigation.links";

export function AppCommand() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const down = () => {
    setOpen((open) => !open);
  };

  useHotkeys("mod+k", down);

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
        <CommandInput placeholder="Chercher ou lancer une action..." />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Actions rapides">
            <CommandItem
              onSelect={() => {
                router.push("/app/pipeline");
              }}
            >
              <Plus className="mr-2 size-4" />
              <span>Ajouter une mission</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/app/contacts");
              }}
            >
              <UserPlus className="mr-2 size-4" />
              <span>Nouveau contact</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/app/pipeline");
              }}
            >
              <Bell className="mr-2 size-4" />
              <span>Nouvelle relance</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/app/platforms");
              }}
            >
              <Globe className="mr-2 size-4" />
              <span>Plateformes</span>
            </CommandItem>
          </CommandGroup>
          {APP_LINKS.map((link, index) => (
            <CommandGroup heading={link.title} key={index}>
              {link.links.map((link) => (
                <CommandItem
                  key={link.href}
                  onSelect={() => {
                    router.push(link.href);
                  }}
                >
                  <link.Icon className="mr-2 size-4" />
                  <span>{link.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
