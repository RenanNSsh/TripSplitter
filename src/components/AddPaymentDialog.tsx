import { useEffect, useState, type ReactNode } from "react";
import { Category, CATEGORIES, Payment, Attachment } from "@/types/expense";
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
import { ArrowRightLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AttachmentDropzone } from "./AttachmentDropzone";

interface AddPaymentDialogProps {
  onAdd: (payment: Omit<Payment, "id">) => void;
  entities: string[];
  entityMembers: Record<string, string[]>;
  trigger?: ReactNode;
}

export function AddPaymentDialog({ onAdd, entities, entityMembers, trigger }: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [from, setFrom] = useState<string>(entities[0] || "");
  const [to, setTo] = useState<string>(entities[1] || entities[0] || "");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    setFrom((prev) => (entities.includes(prev) ? prev : entities[0] || ""));
    setTo((prev) => (entities.includes(prev) ? prev : entities[1] || entities[0] || ""));
  }, [entities]);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCategory("general");
    setFrom(entities[0] || "");
    setTo(entities[1] || entities[0] || "");
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

    if (!from || !to || from === to) {
      toast({
        title: "Participantes inválidos",
        description: "Selecione pessoas diferentes para pagar e receber",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const mainAttachment = attachments[0];

    onAdd({
      amount: parsedAmount,
      description: description.trim() || undefined,
      category,
      from,
      to,
      date: now,
      attachments,
      attachmentName: mainAttachment?.name,
      attachmentDataUrl: mainAttachment?.dataUrl,
    });

    toast({
      title: "Pagamento registrado",
      description: `${from} pagou R$ ${parsedAmount.toFixed(2)} para ${to}`,
    });

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
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 shadow-lg hover:shadow-glow"
          >
            <ArrowRightLeft className="h-5 w-5" />
            Registrar Pagamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Pagamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Valor (R$)</Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-description">Descrição (opcional)</Label>
            <Input
              id="payment-description"
              placeholder="Ex: Acerto do carro"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>De (quem está pagando)</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Para</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
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
          </div>

          <Button type="submit" className="w-full" size="lg">
            Registrar Pagamento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
