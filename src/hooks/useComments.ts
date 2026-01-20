import { useMemo } from "react";
import { db } from "../lib/instant";
import { id, tx } from "@instantdb/react";
import type { Anchor } from "../lib/anchor";
import type { User } from "../lib/user";

// Re-export Anchor type for convenience
export type { Anchor };

export interface Comment {
  id: string;
  pageUrl: string;
  anchor: Anchor;
  content: string;
  author: string;
  authorId: string;
  authorColor: string;
  resolved: boolean;
  createdAt: number;
  parentId?: string;
}

export interface CommentThread extends Comment {
  replies: Comment[];
}

export function useComments(projectId: string | null, pageUrl: string) {
  const { data, isLoading } = db.useQuery(
    projectId
      ? {
          comments: {
            $: {
              where: {
                pageUrl,
              },
            },
            project: {},
          },
        }
      : null
  );

  // Filter to only comments for this project and organize into threads
  const threads = useMemo(() => {
    if (!data?.comments || !projectId) return [];

    // Filter comments by project
    const projectComments = data.comments.filter(
      (c) => c.project?.id === projectId
    ) as Comment[];

    const topLevel = projectComments.filter((c) => !c.parentId);
    const replies = projectComments.filter((c) => c.parentId);

    return topLevel
      .map((parent) => ({
        ...parent,
        replies: replies
          .filter((r) => r.parentId === parent.id)
          .sort((a, b) => a.createdAt - b.createdAt),
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [data, projectId]);

  const addComment = (
    anchor: Anchor,
    content: string,
    user: User,
    parentId?: string
  ): string | null => {
    if (!projectId) return null;

    const commentId = id();
    db.transact([
      tx.comments[commentId].update({
        pageUrl,
        anchor,
        content,
        author: user.name,
        authorId: user.id,
        authorColor: user.color,
        resolved: false,
        createdAt: Date.now(),
        parentId: parentId || null,
      }),
      tx.comments[commentId].link({ project: projectId }),
    ]);

    return commentId;
  };

  const resolveComment = (commentId: string, resolved: boolean) => {
    db.transact(tx.comments[commentId].update({ resolved }));
  };

  const deleteComment = (commentId: string) => {
    db.transact(tx.comments[commentId].delete());
  };

  return {
    threads,
    isLoading,
    addComment,
    resolveComment,
    deleteComment,
  };
}
