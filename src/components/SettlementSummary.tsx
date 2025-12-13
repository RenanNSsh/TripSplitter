import { useMemo, useState } from "react";
import { Balance } from "@/types/expense";
import { ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface SettlementSummaryProps {
  balances: Balance[];
}

export function SettlementSummary({ balances }: SettlementSummaryProps) {
  const people = useMemo(() => balances.map((b) => b.person), [balances]);
  const [personFilter, setPersonFilter] = useState<string>("all");

  // Calculate settlements using a simplified algorithm
  const settlements: { from: string; to: string; amount: number }[] = [];
  
  const debtors = balances.filter(b => b.netBalance < -0.01).map(b => ({ ...b }));
  const creditors = balances.filter(b => b.netBalance > 0.01).map(b => ({ ...b }));
  
  debtors.sort((a, b) => a.netBalance - b.netBalance);
  creditors.sort((a, b) => b.netBalance - a.netBalance);
  
  for (const debtor of debtors) {
    let debt = Math.abs(debtor.netBalance);
    
    for (const creditor of creditors) {
      if (debt < 0.01) break;
      if (creditor.netBalance < 0.01) continue;
      
      const amount = Math.min(debt, creditor.netBalance);
      if (amount >= 0.01) {
        settlements.push({
          from: debtor.person,
          to: creditor.person,
          amount,
        });
        debt -= amount;
        creditor.netBalance -= amount;
      }
    }
  }

  if (settlements.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-md border border-border/50 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Tudo Acertado!</h3>
        <p className="text-muted-foreground text-sm">Todos pagaram sua parte</p>
      </div>
    );
  }

  const filteredSettlements =
    personFilter === "all"
      ? settlements
      : settlements.filter(
          (settlement) => settlement.from === personFilter || settlement.to === personFilter,
        );

  return (
    <div className="bg-card rounded-xl p-6 shadow-md border border-border/50 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Acerto de Contas</h3>

        <Select value={personFilter} onValueChange={setPersonFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filtrar por pessoa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {people.map((person) => (
              <SelectItem key={person} value={person}>
                {person}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-4">
        {filteredSettlements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhuma transferência para esta pessoa</p>
          </div>
        ) : (
          filteredSettlements.map((settlement, index) => (
            <div key={index} className="flex items-center justify-center gap-4 py-3 border-b border-border/50 last:border-0">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-lg mb-1 mx-auto">
                  {settlement.from[0]}
                </div>
                <span className="text-sm font-medium text-foreground">{settlement.from}</span>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <span className="font-mono text-lg font-bold text-primary">
                  R$ {settlement.amount.toFixed(2)}
                </span>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-lg mb-1 mx-auto">
                  {settlement.to[0]}
                </div>
                <span className="text-sm font-medium text-foreground">{settlement.to}</span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-center text-sm text-muted-foreground">
          {filteredSettlements.length === 1
            ? `${filteredSettlements[0].from} deve R$ ${filteredSettlements[0].amount.toFixed(2)} para ${filteredSettlements[0].to}`
            : personFilter === "all"
              ? `${settlements.length} transferências necessárias para acertar as contas`
              : `${filteredSettlements.length} transferências envolvendo ${personFilter}`}
        </p>
      </div>
    </div>
  );
}
