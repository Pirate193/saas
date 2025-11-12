import { NextResponse } from "next/server";
import { ServerBlockNoteEditor } from "@blocknote/server-util";


export async function POST(req: Request) {
  const { markdown } = await req.json();
  const editor = ServerBlockNoteEditor.create();
  const result = await editor.tryParseMarkdownToBlocks(markdown);
  return NextResponse.json({ result });
}
