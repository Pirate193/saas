
import { PDFParse } from 'pdf-parse';  
PDFParse.setWorker('https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs');

async function extractTextFromPDF(url: string): Promise<string> {
  const parser = new PDFParse({ url }); 
  const result = await parser.getText();
  
  return result.text;
}

export default extractTextFromPDF;