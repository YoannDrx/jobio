type ErrorWithDigest = Error & {
  digest?: string;
};

const NEXT_PRERENDER_MARKERS = [
  "NEXT_PRERENDER_INTERRUPTED",
  "E394",
  "needs to bail out of prerendering",
];

export const isNextPrerenderInterruptedError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const payload = [error.message, error.name, (error as ErrorWithDigest).digest]
    .filter(Boolean)
    .join(" ");

  return NEXT_PRERENDER_MARKERS.some((marker) => payload.includes(marker));
};
