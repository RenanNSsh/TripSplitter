export type Category = "eric-car" | "leo-car" | "drinks" | "general";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  paidBy: string;
  date: Date;
  attachmentName?: string;
  attachmentDataUrl?: string;
}

export interface Payment {
  id: string;
  from: string;
  to: string;
  amount: number;
  category: Category;
  date: Date;
  description?: string;
   attachmentName?: string;
   attachmentDataUrl?: string;
}

export interface Balance {
  person: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  totalPaymentsMade: number;
  totalPaymentsReceived: number;
}

export const CATEGORIES: Record<Category, { label: string; icon: string }> = {
  "eric-car": { label: "Carro do Eric", icon: "🚗" },
  "leo-car": { label: "Carro do Léo", icon: "🚙" },
  "drinks": { label: "Bebidas", icon: "🍺" },
  "general": { label: "Geral", icon: "📦" },
};

export const DEFAULT_PARTICIPANTS = ["Eric", "Léo"];
