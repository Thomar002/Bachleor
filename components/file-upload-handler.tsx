import { useRef } from 'react'
import { supabase } from "@/lib/supabaseClient"
import { toast } from 'sonner'

interface FileUploadHandlerProps {
  onFileUploaded: (url: string, fileName: string, fileType: string) => void
  type: 'image' | 'video' | 'file'
  children: React.ReactNode
}

export const FileUploadHandler = ({ onFileUploaded, type, children }: FileUploadHandlerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (type === 'file' && !file.type.includes('pdf')) {
      toast.error('Only PDF files are allowed')
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `questions/${type}s/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('questions')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('questions')
        .getPublicUrl(filePath)

      onFileUploaded(publicUrl, file.name, file.type)
      toast.success('File uploaded successfully')
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error(error.message || 'Failed to upload file')
    }
  }

  return (
    <div onClick={handleClick}>
      {children}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={
          type === 'image' ? 'image/*' :
            type === 'video' ? 'video/*' :
              '.pdf'
        }
        onChange={handleFileSelected}
      />
    </div>
  )
}

