"use client"

import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ImageIcon,
  Video,
  FileText,
  Type,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface EditorToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  onFontChange: (font: string) => void;
  onSizeChange: (size: string) => void;
  onImageUpload: () => void;
  onVideoUpload: () => void;
  onFileUpload: () => void;
  isStudentView?: boolean; // Add this prop
}

export function EditorToolbar({
  onBold,
  onItalic,
  onUnderline,
  onAlign,
  onFontChange,
  onSizeChange,
  onImageUpload,
  onVideoUpload,
  onFileUpload,
  isStudentView
}: EditorToolbarProps) {
  return (
    <div className="border-b border-gray-200 bg-white p-2 flex items-center gap-2">
      <Select defaultValue="arial" onValueChange={onFontChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="arial">Arial</SelectItem>
          <SelectItem value="times">Times New Roman</SelectItem>
          <SelectItem value="calibri">Calibri</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBold}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onItalic}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUnderline}>
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('left')}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('center')}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('right')}>
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('justify')}>
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      {!isStudentView && (
        <>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onImageUpload}>
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onVideoUpload}>
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFileUpload}>
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

