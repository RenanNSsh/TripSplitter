import { useEffect, useState, type ReactNode } from "react";
import { Category, CATEGORIES, Expense, Attachment } from "@/types/expense";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AttachmentDropzone } from "./AttachmentDropzone";

interface AddExpenseDialogProps {
  onAdd: (expense: Omit<Expense, "id">) => void;
  entities: string[];
  entityMembers: Record<string, string[]>;
  trigger?: ReactNode;
}

export function AddExpenseDialog({ onAdd, entities, entityMembers, trigger }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [paidBy, setPaidBy] = useState<string>(entities[0] || "");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    setPaidBy((prev) => (entities.includes(prev) ? prev : entities[0] || ""));
  }, [entities]);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCategory("general");
    setPaidBy(entities[0] || "");
    setAttachments([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um número positivo válido",
        variant: "destructive",
      });
      return;
    }
    
    if (!description.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, insira uma descrição para a despesa",
        variant: "destructive",
      });
      return;
    }

    if (!paidBy) {
      toast({
        title: "Pagador obrigatório",
        description: "Por favor, selecione quem pagou",
        variant: "destructive",
      });
      return;
    }

    const mainAttachment = attachments[0];

    onAdd({
      amount: parsedAmount,
      description: description.trim(),
      category,
      paidBy,
      date: new Date(),
      attachments,
      attachmentName: mainAttachment?.name,
      attachmentDataUrl: mainAttachment?.dataUrl,
    });

    toast({
      title: "Despesa adicionada",
      description: `R$ ${parsedAmount.toFixed(2)} adicionado em ${CATEGORIES[category].label}`,
    });

    // Reset form
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="gap-2 shadow-lg hover:shadow-glow">
            <Plus className="h-5 w-5" />
            Adicionar Despesa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono text-lg"
            />
            <span className="text-xs sm:text-sm text-muted-foreground">
              Pago por <span className="font-medium text-foreground">{paidBy}</span>
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Para que foi essa despesa?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          <AttachmentDropzone
            label="Anexo (opcional)"
            attachments={attachments}
            onChange={setAttachments}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORIES[cat].icon} {CATEGORIES[cat].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidBy">Pago por</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger id="paidBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entityMembers[entity]?.length > 1 ? `${entity} (grupo)` : entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Adicionar Despesa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
