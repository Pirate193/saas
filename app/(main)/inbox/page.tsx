"use client";


import { useState } from "react";


export default function TestPage() {
  const [markdown, setMarkdown] = useState("# Hello World\nThis is **bold** text!");
  const [result, setResult] = useState("");

  async function handleConvert() {
   const response = await fetch("/inbox/test", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: JSON.stringify({ markdown }),
   });
   const data = await response.json();
   setResult(data.result);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold"> Markdown → BlockNote JSON Tester</h1>

      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        className="w-full h-40 border p-2 rounded"
      />

      <button
        onClick={handleConvert}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Convert
      </button>

      <pre className="bg-gray-900 text-green-300 p-4 rounded overflow-auto text-sm h-96">
        {result}
      </pre>
    </div>
  );
}
