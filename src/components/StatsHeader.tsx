import { Category, CATEGORIES } from "@/types/expense";
import { cn } from "@/lib/utils";

interface StatsHeaderProps {
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
  perPersonAverage: number;
}

const categoryColors: Record<Category, string> = {
  "eric-car": "bg-category-eric-car",
  "leo-car": "bg-category-leo-car",
  "drinks": "bg-category-drinks",
  "general": "bg-category-general",
};

export function StatsHeader({ totalExpenses, expensesByCategory, perPersonAverage }: StatsHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-accent to-primary/5 rounded-2xl p-6 md:p-8 shadow-lg border border-primary/10">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground mb-1">Média por pessoa</p>
        <h1 className="text-4xl md:text-5xl font-bold font-mono text-foreground">
          R$ {perPersonAverage.toFixed(2)}
        </h1>
      </div>
      
      {totalExpenses > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">Total Por Categoria</p>
          
          {/* Progress bar */}
          <div className="h-3 rounded-full overflow-hidden flex bg-muted">
            {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
              const amount = expensesByCategory[cat] || 0;
              const percentage = (amount / totalExpenses) * 100;
              if (percentage === 0) return null;
              
              return (
                <div
                  key={cat}
                  className={cn("transition-all duration-500", categoryColors[cat])}
                  style={{ width: `${percentage}%` }}
                  title={`${CATEGORIES[cat].label}: R$ ${amount.toFixed(2)}`}
                />
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
            {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
              const amount = expensesByCategory[cat] || 0;
              if (amount === 0) return null;
              
              return (
                <div key={cat} className="flex items-center gap-2 text-sm">
                  <div className={cn("w-3 h-3 rounded-full", categoryColors[cat])} />
                  <span className="text-muted-foreground">{CATEGORIES[cat].label}</span>
                  <span className="font-mono font-medium text-foreground">
                    R$ {amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
