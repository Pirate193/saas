import React, { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Expand, Loader2 } from 'lucide-react'
import { Document, Page } from 'react-pdf'
import { useResizeDetector } from 'react-resize-detector'
import { toast } from 'sonner'
import { Button } from '../ui/button'

import { ScrollArea, ScrollBar } from '../ui/scroll-area'

// 3. Add fileName to the props
interface PdfFullscreenProps {
  fileUrl: string
  fileName: string
}

const PdfFullscreen = ({ fileUrl, fileName }: PdfFullscreenProps) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [isOpen, setIsOpen] = useState(false)
  const { width, ref } = useResizeDetector()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        <Button
          variant="ghost"
          className="gap-1.5"
          aria-label="fullscreen"
        >
          <Expand className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      {/* 4. Set a fixed height, max-width, and flex-col layout on DialogContent */}
      <DialogContent className="w-full max-w-7xl h-[90vh] p-0 flex flex-col">
        
        {/* 5. Add the DialogHeader with DialogTitle to fix accessibility error */}
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle><p className='truncate' > {fileName}</p> </DialogTitle>
        </DialogHeader>

        {/* 6. Make ScrollArea fill the remaining space */}
        <ScrollArea className="flex-1 h-full">
        
          <div ref={ref} className="p-4"> 
            <Document
            
              key={isOpen ? 'pdf-open' : 'pdf-closed'}
              loading={
                <div className="flex justify-center">
                  <Loader2 className="my-24 h-6 w-6 animate-spin" />
                </div>
              }
              onLoadError={() => {
                toast.error('Failed to load PDF')
              }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              file={fileUrl}
            >
              {/* Only map and render pages *after* the width has been measured */}
              {width
                ? new Array(numPages)
                    .fill(0)
                    .map((_, i) => (
                      <Page
                        key={`page_${i + 1}`}
                        width={width}
                        pageNumber={i + 1}
                        // Add some spacing and shadow for better page separation
                        className="mb-4 shadow-lg" 
                      />
                    ))
                : null}
            </Document>
          </div>
          {/* 7. Add the horizontal scrollbar! */}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default PdfFullscreen