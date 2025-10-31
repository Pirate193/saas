
import PDFViewer from "@/components/filescomponents/pdf-viewer";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import  Image from "next/image";
const FilePage =  async ({params}:{params:Promise<{fileId:string}>}) => {
    const {fileId} = await params;
    const file = await fetchQuery(api.files.getFile,{fileId:fileId as Id<'files'>})

    if(!file){
      return(
       <div className='flex items-center justify-center h-[600px] w-full' >
                <div className='flex items-center justify-center ' >
                    <p> File not Found</p>
                    <Link href={`/folders}`} >
                              <Button  >
                        <ArrowLeft className='h-4 w-4' /> 
                    </Button>
                    </Link>
          
               </div>
            </div>
      )
    }
   
    const renderFileView =()=>{
      switch(file.file.fileType){
        case 'application/pdf':
          return (<PDFViewer fileName={file.file.fileName} fileUrl={file.fileurl as string }  />)
        case 'image/*':
          return (
            <Image 
                    src={file.fileurl as string}
                    alt={file.file.fileName || 'image'}
                    className='max-w-full h-[100vh] object-contain'
             />
          )
         default:
                return(
                    <div className='text-center py-12'>
                        <p className='text-gray-100 mb-4'>
                            Preview not available yet for this file type 
                        </p>
                        <Button asChild >
                            <a href={file.fileurl as string} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className='h-4 w-4 mr-2' />
                                Open File in new tab
                            </a>
                        </Button>
                    </div>
             );
      }
    }
  return (
    <div>
      {renderFileView()}
    </div>
  )
}

export default FilePage