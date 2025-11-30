"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { markdownToBlockNote } from "@/lib/convertmarkdowntoblock"; // 👈 Update path if needed
import { ArrowRight, Play, Database, ListChecks, Table } from "lucide-react";
import { testAction } from "./testaction";

// --- PRESET TEST CASES ---
const TEST_CASES = {
  youtube: `Here is a video:
@youtube[https://www.youtube.com/watch?v=dQw4w9WgXcQ]
End of video.`,

  quiz: `Let's test your knowledge.
@quiz[Math Basics]{
[
  {
    "question": "What is 2+2?",
    "type": "single",
    "options": ["3", "4", "5", "6"],
    "correctAnswers": ["4"],
    "explanation": "Basic addition."
  },
  {
    "question": "Select primes",
    "type": "multiple",
    "options": ["2", "4", "7", "9"],
    "correctAnswers": ["2", "7"],
    "explanation": "2 and 7 are prime."
  }
]
}`,

  table: `Here is a data table:

| Name | Role | Status |
|---|---|---|
| Alice | Admin | Active |
| Bob | User | Pending |

End of table.`,

  complex: `# Main Title
This is a paragraph with **bold** and *italic* text.

## Subsection
1. List item one
2. List item two

---

> This is a quote block.

\`\`\`javascript
console.log("Hello World");
\`\`\`
`,
};

export default function TestParserPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setError(null);
    try {
      const result = await testAction({ input });
      // Prettify JSON
      const pretty = JSON.stringify(JSON.parse(result), null, 2);
      setOutput(pretty);
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const loadPreset = (key: keyof typeof TEST_CASES) => {
    setInput(TEST_CASES[key]);
  };

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Markdown Parser Debugger</h1>
        <Button onClick={handleConvert} size="lg">
          <Play className="w-4 h-4 mr-2" /> Run Parse
        </Button>
      </div>

      {/* Preset Toolbar */}
      <div className="flex gap-2 p-4 bg-muted/30 rounded-lg border">
        <span className="text-sm font-medium self-center mr-2">
          Load Preset:
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadPreset("youtube")}
        >
          <Play className="w-3 h-3 mr-2" /> YouTube
        </Button>
        <Button variant="outline" size="sm" onClick={() => loadPreset("quiz")}>
          <ListChecks className="w-3 h-3 mr-2" /> Quiz
        </Button>
        <Button variant="outline" size="sm" onClick={() => loadPreset("table")}>
          <Table className="w-3 h-3 mr-2" /> Table
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadPreset("complex")}
        >
          <Database className="w-3 h-3 mr-2" /> Mixed
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left: Input */}
        <Card className="flex flex-col h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Markdown Input
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-full resize-none border-0 focus-visible:ring-0 p-4 font-mono text-sm"
              placeholder="Paste markdown here..."
            />
          </CardContent>
        </Card>

        {/* Right: Output */}
        <Card className="flex flex-col h-full bg-slate-950 text-slate-50 border-slate-800">
          <CardHeader className="pb-2 bg-slate-900 border-b border-slate-800">
            <CardTitle className="text-sm font-medium text-slate-400 flex justify-between">
              <span>BlockNote JSON Output</span>
              {output && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                  Valid JSON
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <div className="absolute inset-0 overflow-auto p-4">
              {error ? (
                <div className="text-red-400 font-mono text-sm">
                  Error: {error}
                </div>
              ) : (
                <pre className="font-mono text-xs leading-relaxed text-blue-200">
                  {output || "// Click 'Run Parse' to see output"}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
