

export default async function FolderPage({params}:{params:Promise<{folderId:string}>}) {
   const {folderId} = await params
  return (
    <div className='flex-1' > 
      
      <h1 className='text-2xl font-bold p-4' >Folder: {folderId} </h1>
     </div>

  )
}