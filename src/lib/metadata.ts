import type { PageParams } from "@/types/next";
import type { Metadata, ResolvingMetadata } from "next";

/**
 * Add a suffix to the title of the parent metadata
 *
 * If a layout in /users/ define the title as "Users", the title will be append to the title as "Users · My suffix"
 *
 * @param suffix The suffix to append to the title
 * @returns
 */
export const combineWithParentMetadata =
  (metadata: Metadata) =>
  async (_: PageParams, parent: ResolvingMetadata): Promise<Metadata> => {
    const parentMetadata = await parent;
    return {
      ...metadata,
      title: `${parentMetadata.title?.absolute} · ${metadata.title}`,
    };
  };
