import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;
type LegacyAppRedirectProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<SearchParams>;
};

const buildQueryString = (searchParams: SearchParams): string => {
  const query = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(searchParams)) {
    if (typeof rawValue === "string") {
      query.set(key, rawValue);
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        query.append(key, value);
      }
    }
  }

  return query.toString();
};

export default async function LegacyAppRedirect(props: LegacyAppRedirectProps) {
  const [{ slug }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const pathname = slug?.length ? `/job/${slug.join("/")}` : "/job";
  const query = buildQueryString(searchParams);

  redirect(query ? `${pathname}?${query}` : pathname);
}
