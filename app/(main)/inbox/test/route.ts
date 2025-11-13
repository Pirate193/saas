import { NextResponse } from "next/server";

import { blockNoteToMarkdown } from "@/lib/convertmarkdowntoblock";


export async function POST(req: Request) {
  const { markdown } = await req.json();
  const result = blockNoteToMarkdown(markdown);
  return NextResponse.json({ result });
}
