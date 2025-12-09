import { Expense } from "@/types/expense";
import { CategoryBadge } from "./CategoryBadge";
import { Button } from "./ui/button";
import { Trash2, Pencil, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExpenseItemProps {
  expense: Expense;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

 export function ExpenseItem({ expense, onDelete, onEdit }: ExpenseItemProps) {
  return (
    <div className="group bg-card rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border/50 animate-slide-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <CategoryBadge category={expense.category} size="sm" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              {format(expense.date, "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>
          
          <p className="text-sm sm:text-base text-foreground font-medium mb-1 break-words">
            {expense.description}
          </p>
          
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pago por <span className="font-medium text-foreground">{expense.paidBy}</span>
          </p>
          {expense.attachmentName && expense.attachmentDataUrl && (
            <a
              href={expense.attachmentDataUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs sm:text-sm text-primary hover:underline"
            >
              <Paperclip className="h-3 w-3" />
              <span>Anexo</span>
            </a>
          )}
        </div>
        
        <div className="mt-2 sm:mt-0 flex items-center gap-2 sm:gap-3">
          <span className="font-mono text-base sm:text-lg font-semibold text-foreground">
            R$ {expense.amount.toFixed(2)}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(expense.id)}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
