import { useRef, type DragEvent } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Paperclip } from "lucide-react";

interface AttachmentDropzoneProps {
  label: string;
  attachmentName?: string;
  onChange: (attachment: { name: string; dataUrl: string } | null) => void;
}

export function AttachmentDropzone({ label, attachmentName, onChange }: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        onChange({ name: file.name, dataUrl: result });
      }
    };
    reader.readAsDataURL(file);
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
        className="w-full border border-dashed border-border rounded-lg px-3 py-3 text-xs text-muted-foreground flex flex-wrap items-center gap-3 cursor-pointer hover:bg-muted/40 transition-colors overflow-hidden"
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
            {attachmentName ? (
              <span className="text-foreground break-all">{attachmentName}</span>
            ) : (
              <span className="break-words">Solte um arquivo aqui ou clique para escolher</span>
            )}
            <span className="text-[10px] text-muted-foreground">
              Suporta imagens, PDFs e outros arquivos pequenos
            </span>
          </div>
        </div>
        {attachmentName ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            Remover
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs flex-shrink-0"
          >
            Escolher arquivo
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
