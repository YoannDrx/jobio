"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type BlogPostTocSection = {
  id: string;
  label: string;
  title: string;
};

type BlogPostTocProps = {
  sections: BlogPostTocSection[];
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  labelClassName?: string;
  activeLabelClassName?: string;
  titleClassName?: string;
};

const OBSERVER_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: "-20% 0px -60% 0px",
  threshold: [0, 0.2, 0.5, 1],
};

export function BlogPostToc({
  sections,
  className,
  itemClassName,
  activeItemClassName,
  labelClassName,
  activeLabelClassName,
  titleClassName,
}: BlogPostTocProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections[0]?.id ?? null,
  );

  useEffect(() => {
    if (sections.length === 0) return;

    const sectionIds = sections.map((section) => section.id);
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (sectionElements.length === 0) return;

    const resolveCurrentSection = () => {
      const offset = 140;
      let currentId = sectionIds[0];

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element) continue;

        if (element.getBoundingClientRect().top - offset <= 0) {
          currentId = id;
        }
      }

      setActiveSectionId(currentId);
    };

    resolveCurrentSection();

    const observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visibleEntries.length > 0) {
        setActiveSectionId(visibleEntries[0].target.id);
        return;
      }

      resolveCurrentSection();
    }, OBSERVER_OPTIONS);

    sectionElements.forEach((element) => observer.observe(element));

    const onHashChange = () => {
      const hashId = window.location.hash.replace("#", "");
      if (sectionIds.includes(hashId)) {
        setActiveSectionId(hashId);
      }
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [sections]);

  return (
    <nav className={className}>
      {sections.map((section) => {
        const isActive = activeSectionId === section.id;

        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(itemClassName, isActive && activeItemClassName)}
          >
            <span className={cn(labelClassName, isActive && activeLabelClassName)}>
              {section.label}
            </span>
            <span className={titleClassName}>{section.title}</span>
          </a>
        );
      })}
    </nav>
  );
}
