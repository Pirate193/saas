import { Id } from "@/convex/_generated/dataModel"
import Dashboard from "./dashboard"


export default async function FolderPage({params}:{params:Promise<{folderId:string}>}) {
   const {folderId} = await params
  return (
    <div className='flex-1 overflow-y-auto scrollbar-hidden' > 
     <Dashboard folderId={folderId as Id<'folders'> } />
     </div>

  )
}