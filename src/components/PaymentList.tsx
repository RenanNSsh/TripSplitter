import { useState } from "react";
import { Payment, Category, CATEGORIES, Attachment } from "@/types/expense";
import { CategoryBadge } from "./CategoryBadge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Trash2, Pencil, Plus, Paperclip } from "lucide-react";
import { AddPaymentDialog } from "./AddPaymentDialog";
import { AttachmentDropzone } from "./AttachmentDropzone";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface PaymentListProps {
  payments: Payment[];
  participants: string[];
  onDelete: (id: string) => void;
  onUpdate: (payment: Payment) => void;
  onAdd: (payment: Omit<Payment, "id">) => void;
}

export function PaymentList({ payments, participants, onDelete, onUpdate, onAdd }: PaymentListProps) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [editing, setEditing] = useState<Payment | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("general");
  const [editFrom, setEditFrom] = useState<string>(" ");
  const [editTo, setEditTo] = useState<string>(" ");
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);

  const filteredPayments =
    filter === "all" ? payments : payments.filter((p) => p.category === filter);

  const startEdit = (payment: Payment) => {
    setEditing(payment);
    setEditAmount(payment.amount.toString());
    setEditDescription(payment.description ?? "");
    setEditCategory(payment.category);
    setEditFrom(payment.from);
    setEditTo(payment.to);
    if (payment.attachments && payment.attachments.length > 0) {
      setEditAttachments(payment.attachments);
    } else if (payment.attachmentName && payment.attachmentDataUrl) {
      setEditAttachments([{ name: payment.attachmentName, dataUrl: payment.attachmentDataUrl }]);
    } else {
      setEditAttachments([]);
    }
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um número positivo válido",
        variant: "destructive",
      });
      return;
    }

    if (!editFrom || !editTo || editFrom === editTo) {
      toast({
        title: "Participantes inválidos",
        description: "Selecione pessoas diferentes para pagar e receber",
        variant: "destructive",
      });
      return;
    }

    onUpdate({
      ...editing,
      amount: parsedAmount,
      description: editDescription.trim() || undefined,
      category: editCategory,
      from: editFrom,
      to: editTo,
      attachments: editAttachments,
      attachmentName: editAttachments[0]?.name,
      attachmentDataUrl: editAttachments[0]?.dataUrl,
    });

    toast({
      title: "Pagamento atualizado",
      description: `${editFrom} pagou R$ ${parsedAmount.toFixed(2)} para ${editTo}`,
    });

    setEditOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Pagamentos</h2>
          <AddPaymentDialog
            onAdd={onAdd}
            participants={participants}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredPayments.length} pagamento
          {filteredPayments.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="rounded-full"
        >
          Todos
        </Button>
        {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(cat)}
            className="rounded-full"
          >
            {CATEGORIES[cat].icon} {CATEGORIES[cat].label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">Nenhum pagamento registrado</p>
            <p className="text-sm mt-1">Use o botão acima para registrar um pagamento</p>
          </div>
        ) : (
          filteredPayments.map((payment) => {
            const mainAttachment =
              (payment.attachments && payment.attachments[0]) ||
              (payment.attachmentName && payment.attachmentDataUrl
                ? { name: payment.attachmentName, dataUrl: payment.attachmentDataUrl }
                : null);

            return (
              <div
                key={payment.id}
                className="group bg-card rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border/50 animate-slide-up"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <CategoryBadge category={payment.category} size="sm" />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {format(payment.date, "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-foreground font-medium mb-1 break-words">
                      {payment.description || `Pagamento de ${payment.from} para ${payment.to}`}
                    </p>

                    <p className="text-xs sm:text-sm text-muted-foreground">
                      De <span className="font-medium text-foreground">{payment.from}</span> para{" "}
                      <span className="font-medium text-foreground">{payment.to}</span>
                    </p>
                    {mainAttachment && (
                      <a
                        href={mainAttachment.dataUrl}
                        download={mainAttachment.name || "anexo"}
                        className="mt-1 inline-flex items-center gap-1 text-xs sm:text-sm text-primary hover:underline"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span>Anexo</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-2 sm:mt-0 flex items-center gap-2 sm:gap-3">
                    <span className="font-mono text-base sm:text-lg font-semibold text-foreground">
                      R$ {payment.amount.toFixed(2)}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(payment)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(payment.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-payment-amount">Valor (R$)</Label>
              <Input
                id="edit-payment-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="font-mono text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-payment-description">Descrição (opcional)</Label>
              <Input
                id="edit-payment-description"
                placeholder="Ex: Acerto do carro"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={100}
              />
            </div>

            <AttachmentDropzone
              label="Anexo (opcional)"
              attachments={editAttachments}
              onChange={setEditAttachments}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>De</Label>
                <Select value={editFrom} onValueChange={setEditFrom}>
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
                <Label>Para</Label>
                <Select value={editTo} onValueChange={setEditTo}>
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
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v as Category)}>
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
              Salvar alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
