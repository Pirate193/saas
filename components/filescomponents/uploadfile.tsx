'use client'
import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog"
import { useCallback, useRef, useState } from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { CheckCircle2, FileIcon, Loader2, Plus, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"

interface Props {
    open:boolean,
    onclose:(open:boolean)=>void
    folderId?:Id<'folders'>;
}
interface FileUplaodStatus {
    file:File,
    status:"pending"|"uploading"|"success"|"error";
    progress?:number;
    error?:string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/rtf",
  "video/mp4",
  "video/x-msvideo",
];

const Uploadfile = ({open,onclose,folderId}:Props) => {
    const upload = useMutation(api.files.uploadFile)
    const generateUrl = useMutation(api.files.generateUploadUrl);
   const [isDragOver, setIsDragOver] = useState(false);
   const [files,setFiles]=useState<FileUplaodStatus[]>([]);
   const [isUplaoding, setIsUplaoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isloading, setIsloading] = useState(false);
    
  //validate file
  const validateFile = (file:File):string |null=>{
    if(file.size > MAX_FILE_SIZE){
      return "File size should be less than 10MB";
    }
    const fileType = file.type;
    const isAllowed = ALLOWED_TYPES.some((type)=>{
        if(type.endsWith("/*")){
            const prefix = type.slice(0,-2);
            return fileType.startsWith(prefix);
            }
        return fileType === type;
    
    })
    if(!isAllowed){
        return "Invalid file type";
    }
    return null;
  }


   const handlefileSelect = useCallback((selectedFiles:FileList|null)=>{
    if(!selectedFiles || selectedFiles.length === 0){
        return;
    }
    const newFiles:FileUplaodStatus[]=[];
    Array.from(selectedFiles).forEach((file)=>{
        const error = validateFile(file);
        if(error){
            toast.error('Invalid file type')
            return;
        
        }
       newFiles.push({
        file,
        status:"pending"
       })
    });
    setFiles((prev)=>[...prev,...newFiles]);

   },
[toast]);
    
//upload single file
const uploadSingleFile = async (fileStatus:FileUplaodStatus):Promise<void>=>{
    const {file}= fileStatus;
    try{
        setFiles((prev)=>prev.map((f)=>
        f.file === file ? {...f,status:"uploading",progress:0}:f));
        const uploadUrl = await generateUrl();
        const result = await fetch(uploadUrl,{
            method:"POST",
            headers:{"Content-Type":file.type},
            body:file
        });

        if(!result.ok){
            throw new Error("Failed to upload file");
        }
        const {storageId}= await result.json();
        await upload({
            folderId:folderId,
            fileName:file.name,
            fileType:file.type,
            storageId:storageId
        })
        setFiles((prev)=>prev.map((f)=>
        f.file === file ? {...f,status:"success",progress:100}:f));
    }catch(error){
         console.error("Upload error:", error);

      // Update status to error
      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? {
                ...f,
                status: "error",
                error:
                  error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
      toast.error("Upload failed");
    }
}
const handleUploadAll = async ()=>{
    if(files.length === 0) return
    setIsUplaoding(true);
    try{
        for(const fileStatus of files){
            if(fileStatus.status === "pending"){
                await uploadSingleFile(fileStatus)
            }
        }
        const allSuccessful = files.every((f)=>f.status === "success");

        if(allSuccessful){
            toast.success("Files uploaded successfully");
        }
        setTimeout(()=>{
            onclose(false);
            setFiles([]);
        },1000)
    }finally{
        setIsUplaoding(false);
    }
}

//remove file from list 
const handleRemoveFile =(file:File)=>{
    setFiles((prev)=>prev.filter((f)=>f.file !== file));
}
    const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    handlefileSelect(e.dataTransfer.files)
    },
    [handlefileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);
  const handleDragleave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const formatFileSize =(bytes:number):string=>{
    if(bytes<1024) return bytes + "B";
    if(bytes < 1024 * 1024) return (bytes / 1024).toFixed(1)+ "KB";
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  }
 
  return (
    <Dialog open={open} onOpenChange={onclose} >
       <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col" >
        <DialogTitle>Upload File</DialogTitle>
           <div className="flex-1 overflow-y-auto space-y-4">
          {/* Drop Zone */}
          {files.length === 0 && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-gray-400"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragleave}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Drop files here or click browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, Images, Docs, Videos up to 10MB
                </p>
                <Button
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.rtf,.mp4,.avi"
                  onChange={(e) => handlefileSelect(e.target.files)}
                />
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((fileStatus, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {fileStatus.file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(fileStatus.file.size)}
                    </p>

                    {fileStatus.status === "error" && (
                      <p className="text-sm text-destructive">
                        {fileStatus.error}
                      </p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="shrink-0">
                    {fileStatus.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile(fileStatus.file)}
                        disabled={isUplaoding}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {fileStatus.status === "uploading" && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {fileStatus.status === "success" && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {fileStatus.status === "error" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile(fileStatus.file)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUplaoding}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Files
              </Button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {files.length > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onclose(false)}
              disabled={isUplaoding}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadAll} disabled={isUplaoding}>
              {isUplaoding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>Upload {files.length} file(s)</>
              )}
            </Button>
          </div>
        )}

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.rtf,.mp4,.avi"
          onChange={(e) => handlefileSelect(e.target.files)}
        />
       </DialogContent>
    </Dialog>
  )
}

export default Uploadfile