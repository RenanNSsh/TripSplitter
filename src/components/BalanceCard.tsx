import { Balance } from "@/types/expense";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  balance: Balance;
  members?: string[];
}

export function BalanceCard({ balance, members }: BalanceCardProps) {
  const isPositive = balance.netBalance >= 0;
  const isGroup = members && members.length > 1;

  return (
    <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{balance.person}</h3>
            {isGroup && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Grupo
              </span>
            )}
          </div>
          {isGroup && members && (
            <p className="text-xs text-muted-foreground">
              Membros: {members.join(", ")}
            </p>
          )}
        </div>
        <div
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
          )}
        >
          {isPositive ? "Recebe" : "Deve"}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Total em despesas</span>
          <span className="font-mono font-semibold text-foreground">
            R$ {balance.totalPaid.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Pagamentos realizados</span>
          <span className="font-mono font-semibold text-foreground">
            R$ {balance.totalPaymentsMade.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Pagamentos recebidos</span>
          <span className="font-mono font-semibold text-foreground">
            R$ {balance.totalPaymentsReceived.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Valor a pagar</span>
          <span className="font-mono text-muted-foreground">
            R$ {balance.totalOwed.toFixed(2)}
          </span>
        </div>

        <div className="h-px bg-border my-2" />

        <div className="flex justify-between items-center">
          <span className="text-foreground font-medium">Saldo</span>
          <span
            className={cn(
              "font-mono text-xl font-bold",
              isPositive ? "text-success" : "text-destructive",
            )}
          >
            {isPositive ? "+" : ""}R$ {Math.abs(balance.netBalance).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
