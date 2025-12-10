import { useRef, type DragEvent } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Paperclip } from "lucide-react";
import type { Attachment } from "@/types/expense";

interface AttachmentDropzoneProps {
  label: string;
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

export function AttachmentDropzone({ label, attachments, onChange }: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newAttachments: Attachment[] = [];
    let remaining = fileArray.length;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          newAttachments.push({ name: file.name, dataUrl: reader.result });
        }
        remaining -= 1;
        if (remaining === 0 && newAttachments.length > 0) {
          onChange([...attachments, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-2 w-full max-w-full">
      <Label>{label}</Label>
      <div
        className="w-full border border-dashed border-border rounded-lg px-3 py-3 text-xs text-muted-foreground flex flex-col gap-3 cursor-pointer hover:bg-muted/40 transition-colors overflow-hidden"
        onClick={handleClick}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Paperclip className="h-4 w-4 shrink-0" />
          <div className="flex flex-col min-w-0">
            {attachments.length > 0 ? (
              <span className="text-foreground break-all">
                {attachments.length === 1
                  ? attachments[0].name
                  : `${attachments.length} arquivos anexados`}
              </span>
            ) : (
              <span className="break-words">Solte arquivos aqui ou clique para escolher</span>
            )}
            <span className="text-[10px] text-muted-foreground">
              Suporta imagens, PDFs e outros arquivos pequenos
            </span>
          </div>
        </div>
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 max-w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px] text-foreground truncate max-w-[140px]">
                  {file.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(attachments.filter((_, i) => i !== index));
                  }}
                >
                  <span className="sr-only">Remover</span>
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
