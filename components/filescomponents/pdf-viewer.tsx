'use client'
import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCw
} from 'lucide-react'


import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useResizeDetector } from 'react-resize-detector'
import { string, z } from 'zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { ScrollArea } from '../ui/scroll-area'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`


interface PDFViewerProps {
  fileUrl: string
  fileName: string
}

const PDFViewer = ({ fileUrl, fileName }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [currPage,setCurrPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [rotation,setRotation] = useState<number>(0)
  
   
  // const CustomPageValidator = z.object({
  //   page:z
  //     .string()
  //     .refine(
  //       (num)=>Number(num)>0 && Number(num)<=numPages!,
        
  //     ),
  // })
  // type TCustomPageValidator = z.infer<typeof CustomPageValidator>

  // const {register,handleSubmit,formState:{errors},setValue}=useForm<TCustomPageValidator>({
  //   defaultValues:{
  //     page:'1',
  //   },
  //   resolver:zodResolver(CustomPageValidator),
  // })
  // console.log(errors)
  const {width,ref}=useResizeDetector()

  // const handlePageSubmit=({page}:TCustomPageValidator)=>{
  //   setCurrPage(Number(page))
  //   setValue('page',String(page))
  // }
  return (
    <div className='w-full bg-background rounded-md shadow flex flex-col items-center' >
      {/* header */}
      <div className='h-14 w-full border-b border-border flex items-center justify-between px-2' >
        
       <div className='flex items-center gap-1.5'>
        <Button
        disabled={currPage<=1}
        onClick={()=>{setCurrPage((prev)=>prev-1>1?prev-1:1)
        }// setValue('page',String(currPage-1))}
        }
        >
          <ChevronDown className='h-4 w-4' />
        </Button>
        <div className='flex items-center gap-1.5' >
          <Input />
          <p className='text-sm space-x-1' >
            <span>/</span>
            <span>{numPages ?? 'x'} </span>
          </p>
        </div>
        
        <Button 
        disabled={
          numPages === undefined || 
          currPage === numPages
        }
        onClick={()=>{
          setCurrPage((prev)=>
          prev + 1 >numPages! ? numPages!:prev+1
          )
          // setValue('page',String(currPage+1))
        }}>
          <ChevronUp className='h-4 w-4' />
        </Button>
       
       </div>
       <div  className='flex flex-row items-center ' >
            <h1>{fileName} </h1>
         </div>
       <div className='space-x-2' >
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Search className='h-4 w-4' />
             {scale*100}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={()=>setScale(1)}>
            100%
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={()=>setScale(1.5)}>
            150%
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={()=>setScale(2)}>
            200%
          </DropdownMenuItem>
        </DropdownMenuContent>
       </DropdownMenu>
       <Button
       onClick={()=>setRotation((prev)=>prev+90)}
       >
        <RotateCw className='h-4 w-4' />
       </Button>
       <Button asChild >
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
            <Download className='h-4 w-4' />
           
            </a>
         </Button>
       </div>
      </div>
      {/* pdf viewer */}
      <div className='flex-1 w-full max-h-screen' >
         <ScrollArea className='max-h-[calc(100vh-10rem)]' >
          <div ref={ref} >
            <Document
            loading={
              <div className='flex justify-center'>
                <Loader2 className='my-24 h-6 w-6 animate-spin' />
              </div>
            }
            file={fileUrl}
            onLoadSuccess={({numPages})=>setNumPages(numPages)}
            onLoadError={()=>{
              toast.error('Failed to load PDF')
            }}
            className='max-h-full'
            >
              <Page
              width={width?width:1}
              pageNumber={currPage}
              scale={scale}
              rotate={rotation}
              />

            </Document>
          </div>
         </ScrollArea>
      </div>
    </div>
  )
}

export default PDFViewer
