import { useState, type ReactNode } from "react";
import { Category, CATEGORIES, Payment } from "@/types/expense";
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
import { ArrowRightLeft, Check, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AttachmentDropzone } from "./AttachmentDropzone";

interface AddPaymentDialogProps {
  onAdd: (payment: Omit<Payment, "id">) => void;
  participants: string[];
  trigger?: ReactNode;
}

export function AddPaymentDialog({ onAdd, participants, trigger }: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [fromList, setFromList] = useState<string[]>(
    participants.length > 0 ? [participants[0]] : [],
  );
  const [to, setTo] = useState<string>(participants[1] || participants[0] || "");
  const [fromOpen, setFromOpen] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string } | null>(null);

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

    if (fromList.length === 0 || !to || fromList.includes(to)) {
      toast({
        title: "Participantes inválidos",
        description: "Selecione uma ou mais pessoas diferentes de quem recebe",
        variant: "destructive",
      });
      return;
    }

    const payers = fromList;
    const count = payers.length;
    const totalCents = Math.round(parsedAmount * 100);
    const baseCents = Math.floor(totalCents / count);
    const remainder = totalCents % count;
    const now = new Date();

    payers.forEach((payer, index) => {
      const cents = baseCents + (index < remainder ? 1 : 0);
      const shareAmount = cents / 100;

      onAdd({
        amount: shareAmount,
        description: description.trim() || undefined,
        category,
        from: payer,
        to,
        date: now,
        attachmentName: attachment?.name,
        attachmentDataUrl: attachment?.dataUrl,
      });
    });

    if (count === 1) {
      toast({
        title: "Pagamento registrado",
        description: `${payers[0]} pagou R$ ${parsedAmount.toFixed(2)} para ${to}`,
      });
    } else {
      toast({
        title: "Pagamentos registrados",
        description: `${count} pessoas pagaram juntas R$ ${parsedAmount.toFixed(
          2,
        )} para ${to}`,
      });
    }

    setAmount("");
    setDescription("");
    setCategory("general");
    setFromList(participants.length > 0 ? [participants[0]] : []);
    setTo(participants[1] || participants[0] || "");
    setAttachment(null);
    setOpen(false);
  };

  const toggleFrom = (person: string) => {
    setFromList((prev) =>
      prev.includes(person) ? prev.filter((p) => p !== person) : [...prev, person],
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setFromOpen(false);
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
            attachmentName={attachment?.name}
            onChange={setAttachment}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>De (quem está pagando)</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFromOpen((v) => !v)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <span className="line-clamp-1 text-left">
                    {fromList.length === 0 && "Selecione quem paga"}
                    {fromList.length === 1 && fromList[0]}
                    {fromList.length > 1 && `${fromList.length} pessoas selecionadas`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>

                {fromOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-60 overflow-auto">
                    {participants.map((person) => {
                      const selected = fromList.includes(person);
                      return (
                        <button
                          key={person}
                          type="button"
                          onClick={() => toggleFrom(person)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                            selected ? "bg-accent text-accent-foreground" : ""
                          }`}
                        >
                          <span>{person}</span>
                          {selected && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione uma ou mais pessoas que estão pagando esse valor.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Para</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
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
