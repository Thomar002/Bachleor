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
  ActivityIcon as Function,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EditorToolbar() {
  return (
    <div className="border-b border-gray-200 bg-white p-2 flex items-center gap-2">
      <Select defaultValue="12">
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="arial">Arial</SelectItem>
          <SelectItem value="times">Times New Roman</SelectItem>
          <SelectItem value="calibri">Calibri</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="12">
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36].map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1 border-l border-r px-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r px-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Type className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <FileText className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Function className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

