'use server';

import { markdownToBlockNote } from "@/lib/convertmarkdowntoblock";

export async function testAction({input}: {input: string}) {
      const result = markdownToBlockNote(input);
      return result;
}