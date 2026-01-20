import { useEffect, useState } from "react";
import { db } from "../lib/instant";
import { id, tx } from "@instantdb/react";

/**
 * Auto-create or fetch project by domain
 */
export function useProject() {
  const domain = window.location.hostname;
  const [projectId, setProjectId] = useState<string | null>(null);

  const { data, isLoading } = db.useQuery({
    projects: {
      $: {
        where: { domain },
      },
    },
  });

  useEffect(() => {
    if (isLoading) return;

    const existingProject = data?.projects?.[0];

    if (existingProject) {
      setProjectId(existingProject.id);
    } else {
      // Create new project for this domain
      const newId = id();
      db.transact(
        tx.projects[newId].update({
          domain,
          name: domain,
          createdAt: Date.now(),
        })
      );
      setProjectId(newId);
    }
  }, [data, isLoading, domain]);

  return { projectId, isLoading: isLoading || !projectId };
}
