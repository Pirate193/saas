'use client'
import React, { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download,
  Loader2,
  RotateCw
} from 'lucide-react'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useResizeDetector } from 'react-resize-detector'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
// --- START OF FIX ---
// 1. Import ScrollBar along with ScrollArea
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import PdfFullscreen from './pdfFullscreen'
// --- END OF FIX ---

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`


interface PDFViewerProps {
  fileUrl: string
  fileName: string
}

const PDFViewer = ({ fileUrl, fileName }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [currPage, setCurrPage] = useState<number>(1)
  const [pageInput, setPageInput] = useState<string>("1")
  const [scale, setScale] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  
  const { width, ref } = useResizeDetector(); 

  useEffect(() => {
    setPageInput(String(currPage))
  }, [currPage])

  const goToPrevPage = () => {
    setCurrPage((prev) => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    if (numPages) {
      setCurrPage((prev) => Math.min(prev + 1, numPages))
    }
  }

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputSubmit = () => {
    const newPage = parseInt(pageInput, 10);
    
    if (isNaN(newPage) || newPage < 1 || newPage > numPages) {
      toast.error(`Invalid page. Must be between 1 and ${numPages}.`)
      setPageInput(String(currPage))
    } else {
      setCurrPage(newPage)
    }
  }

  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.2))
  const zoomIn = () => setScale(s => Math.min(3.0, s + 0.2))

  return (
    <div className='w-full h-full bg-background rounded-md flex flex-col items-center'>
      
      {/* Header / Toolbar (No changes) */}
      <div className='h-14 w-full border-b border-border flex items-center justify-between px-2 gap-2 shrink-0'>
       <div className='flex items-center gap-1'>
        <Button
          variant="ghost"
          size="icon"
          disabled={currPage <= 1}
          onClick={goToPrevPage}
          aria-label="Previous Page"
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
        <div className='flex items-center gap-1.5'>
          <Input 
            className='w-12 h-8 text-center'
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handlePageInputSubmit()
                ;(e.target as HTMLInputElement).blur()
              }
            }}
          />
          <p className='text-sm text-muted-foreground'>
            / {numPages || '...'}
          </p>
        </div>
        <Button 
          variant="ghost"
          size="icon"
          disabled={!numPages || currPage >= numPages}
          onClick={goToNextPage}
          aria-label="Next Page"
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
       </div>
       
       <div className='flex-1 text-center min-w-0 px-2'>
          <p className='text-sm font-medium truncate' title={fileName}>
            {fileName}
          </p>
       </div>

       <div className='flex items-center gap-1'>
         <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.5} aria-label="Zoom Out">
            <ZoomOut className='h-4 w-4' />
         </Button>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-[60px] h-8 text-sm">
              {Math.round(scale * 100)}%
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setScale(0.5)}>50%</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setScale(1)}>100%</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setScale(1.4)}>140%</DropdownMenuItem>
     
          </DropdownMenuContent>
         </DropdownMenu>
         <Button variant="ghost" size="icon" onClick={zoomIn} disabled={scale >= 1.4} aria-label="Zoom In">
            <ZoomIn className='h-4 w-4' />
         </Button>
         <Button variant="ghost" size="icon" onClick={() => setRotation((prev) => (prev + 90) % 360)} aria-label="Rotate">
          <RotateCw className='h-4 w-4' />
         </Button>
         <Button variant="ghost" size="icon" asChild aria-label="Download">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={fileName}>
              <Download className='h-4 w-4' />
            </a>
         </Button>
         <PdfFullscreen fileUrl={fileUrl} fileName={fileName}/>
       </div>
      </div>

      <div ref={ref} className='flex-1 w-full overflow-hidden'>
        {width ? (
           <ScrollArea className='h-full'>
            {/* --- START OF FIX --- */}
            {/* 2. Added `min-w-fit` so this div expands with its content */}
            <div className='flex justify-center min-w-fit'> 
            {/* --- END OF FIX --- */}
              <Document
                loading={
                  <div className='flex justify-center p-10'>
                    <Loader2 className='my-24 h-6 w-6 animate-spin' />
                  </div>
                }
                file={fileUrl}
                onLoadSuccess={({numPages}) => {
                  setNumPages(numPages)
                  setCurrPage(1)
                  setPageInput("1")
                }}
                onLoadError={() => {
                  toast.error('Failed to load PDF')
                }}
                className='max-h-full'
              >
                <Page
                  width={width}
                  pageNumber={currPage}
                  scale={scale}
                  rotate={rotation}
                  loading={
                    <div className='flex justify-center p-10'>
                       <Loader2 className='my-24 h-6 w-6 animate-spin' />
                    </div>
                  }
                />
              </Document>
            </div>
           
            <ScrollBar orientation="horizontal" />
           </ScrollArea>
        ) : (
          <div className='flex h-full w-full items-center justify-center'>
            <Loader2 className='my-24 h-6 w-6 animate-spin' />
          </div>
        )}
      </div>
    </div>
  )
}

export default PDFViewer