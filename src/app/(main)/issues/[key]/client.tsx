"use client";

import { useParams } from "next/navigation";
import { IssueDetailContent } from "@/features/projects/components/issue-detail-content";

export default function IssueDetailPage() {
  const { key } = useParams<{ key: string }>();

  return <IssueDetailContent issueKey={key} />;
}
