import { useState, useCallback, useMemo, useEffect } from "react";
import { Expense, Balance, Payment } from "@/types/expense";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, doc, getDocs, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { logActivity } from "@/lib/telemetry";

type CarId = "eric-car" | "leo-car";

const STORAGE_KEY = "travel-expenses";
const PAYMENTS_STORAGE_KEY = "travel-payments";

type FirestoreExpense = Omit<Expense, "date" | "attachmentName" | "attachmentDataUrl"> & {
  date: string;
  attachmentName: string | null;
  attachmentDataUrl: string | null;
};

type FirestorePayment = Omit<Payment, "date" | "attachmentName" | "attachmentDataUrl"> & {
  date: string;
  attachmentName: string | null;
  attachmentDataUrl: string | null;
};

const toExpenseLogData = (expense: Expense) => ({
  amount: expense.amount,
  category: expense.category,
  paidBy: expense.paidBy,
  description: expense.description,
  date: expense.date.toISOString(),
  attachmentsCount: expense.attachments?.length ?? 0,
});

const toPaymentLogData = (payment: Payment) => ({
  amount: payment.amount,
  category: payment.category,
  from: payment.from,
  to: payment.to,
  description: payment.description ?? null,
  date: payment.date.toISOString(),
  attachmentsCount: payment.attachments?.length ?? 0,
});

const serializeExpense = (expense: Expense): FirestoreExpense => {
  const normalizedAttachments =
    expense.attachments && expense.attachments.length > 0
      ? expense.attachments
      : expense.attachmentName && expense.attachmentDataUrl
        ? [{ name: expense.attachmentName, dataUrl: expense.attachmentDataUrl }]
        : [];

  const first = normalizedAttachments[0];

  return {
    ...expense,
    attachments: normalizedAttachments,
    attachmentName: expense.attachmentName ?? first?.name ?? null,
    attachmentDataUrl: expense.attachmentDataUrl ?? first?.dataUrl ?? null,
    date: expense.date.toISOString(),
  };
};

const deserializeExpense = (data: FirestoreExpense): Expense => {
  const { date, attachmentName, attachmentDataUrl, attachments, ...rest } = data as FirestoreExpense & {
    attachments?: { name: string; dataUrl: string }[];
  };

  let normalizedAttachments = attachments ?? [];
  if (normalizedAttachments.length === 0 && attachmentName && attachmentDataUrl) {
    normalizedAttachments = [{ name: attachmentName, dataUrl: attachmentDataUrl }];
  }

  return {
    ...rest,
    date: new Date(date),
    attachments: normalizedAttachments,
    attachmentName: attachmentName ?? undefined,
    attachmentDataUrl: attachmentDataUrl ?? undefined,
  };
};

const serializePayment = (payment: Payment): FirestorePayment => {
  const normalizedAttachments =
    payment.attachments && payment.attachments.length > 0
      ? payment.attachments
      : payment.attachmentName && payment.attachmentDataUrl
        ? [{ name: payment.attachmentName, dataUrl: payment.attachmentDataUrl }]
        : [];

  const first = normalizedAttachments[0];

  return {
    ...payment,
    attachments: normalizedAttachments,
    attachmentName: payment.attachmentName ?? first?.name ?? null,
    attachmentDataUrl: payment.attachmentDataUrl ?? first?.dataUrl ?? null,
    date: payment.date.toISOString(),
  };
};

const deserializePayment = (data: FirestorePayment): Payment => {
  const { date, attachmentName, attachmentDataUrl, attachments, ...rest } = data as FirestorePayment & {
    attachments?: { name: string; dataUrl: string }[];
  };

  let normalizedAttachments = attachments ?? [];
  if (normalizedAttachments.length === 0 && attachmentName && attachmentDataUrl) {
    normalizedAttachments = [{ name: attachmentName, dataUrl: attachmentDataUrl }];
  }

  return {
    ...rest,
    date: new Date(date),
    attachments: normalizedAttachments,
    attachmentName: attachmentName ?? undefined,
    attachmentDataUrl: attachmentDataUrl ?? undefined,
  };
};

const loadExpenses = (): Expense[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((e: Expense) => ({
        ...e,
        date: new Date(e.date),
      }));
    }
  } catch (e) {
    console.error("Failed to load expenses:", e);
  }
  return [];
};

const saveExpenses = (expenses: Expense[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error("Failed to save expenses:", e);
  }
};

const loadPayments = (): Payment[] => {
  try {
    const stored = localStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((p: Payment) => ({
        ...p,
        date: new Date(p.date),
      }));
    }
  } catch (e) {
    console.error("Failed to load payments:", e);
  }
  return [];
};

const savePayments = (payments: Payment[]) => {
  try {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
  } catch (e) {
    console.error("Failed to save payments:", e);
  }
};

export function useExpenses(
  participants: string[],
  participantCars: Record<string, CarId | null>,
  participantDrinks: Record<string, boolean>,
  entities: string[],
  entityMembers: Record<string, string[]>,
) {
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses);
  const [payments, setPayments] = useState<Payment[]>(loadPayments);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const expensesRef = collection(db, "expenses");
    const paymentsRef = collection(db, "payments");

    let unsubscribeExpenses: (() => void) | undefined;
    let unsubscribePayments: (() => void) | undefined;

    (async () => {
      try {
        const localExpenses = loadExpenses();
        const localPayments = loadPayments();

        const [expensesSnap, paymentsSnap] = await Promise.all([
          getDocs(expensesRef),
          getDocs(paymentsRef),
        ]);

        if (expensesSnap.empty && localExpenses.length > 0) {
          void logActivity({ action: "seed", entity: "expenses", data: { count: localExpenses.length } });
          await Promise.all(
            localExpenses.map((expense) =>
              setDoc(doc(expensesRef, expense.id), serializeExpense(expense)),
            ),
          );
        }

        if (paymentsSnap.empty && localPayments.length > 0) {
          void logActivity({ action: "seed", entity: "payments", data: { count: localPayments.length } });
          await Promise.all(
            localPayments.map((payment) =>
              setDoc(doc(paymentsRef, payment.id), serializePayment(payment)),
            ),
          );
        }

        unsubscribeExpenses = onSnapshot(
          expensesRef,
          (snapshot) => {
            const remoteExpenses = snapshot.docs.map((d) =>
              deserializeExpense(d.data() as FirestoreExpense),
            );
            setExpenses(remoteExpenses);
            saveExpenses(remoteExpenses);
          },
          (error) => {
            console.error("Firestore expenses subscription error:", error);
          },
        );

        unsubscribePayments = onSnapshot(
          paymentsRef,
          (snapshot) => {
            const remotePayments = snapshot.docs.map((d) =>
              deserializePayment(d.data() as FirestorePayment),
            );
            setPayments(remotePayments);
            savePayments(remotePayments);
          },
          (error) => {
            console.error("Firestore payments subscription error:", error);
          },
        );
      } catch (e) {
        console.error("Failed to sync expenses/payments with Firestore:", e);
      }
    })();

    return () => {
      if (unsubscribeExpenses) {
        unsubscribeExpenses();
      }
      if (unsubscribePayments) {
        unsubscribePayments();
      }
    };
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
    };
    setExpenses((prev) => {
      const updated = [newExpense, ...prev];
      saveExpenses(updated);
      return updated;
    });
    if (isFirebaseConfigured && db) {
      const expensesRef = collection(db, "expenses");
      void setDoc(doc(expensesRef, newExpense.id), serializeExpense(newExpense)).catch((e) => {
        console.error("Failed to save expense to Firestore:", e);
      });
    }

    void logActivity({
      action: "create",
      entity: "expense",
      entityId: newExpense.id,
      data: toExpenseLogData(newExpense),
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveExpenses(updated);
      return updated;
    });
    if (isFirebaseConfigured && db) {
      const expensesRef = collection(db, "expenses");
      void deleteDoc(doc(expensesRef, id)).catch((e) => {
        console.error("Failed to delete expense from Firestore:", e);
      });
    }

    void logActivity({ action: "delete", entity: "expense", entityId: id });
  }, []);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses((prev) => {
      const updated = prev.map((e) => (e.id === updatedExpense.id ? { ...e, ...updatedExpense } : e));
      saveExpenses(updated);
      return updated;
    });
    if (isFirebaseConfigured && db) {
      const expensesRef = collection(db, "expenses");
      void setDoc(doc(expensesRef, updatedExpense.id), serializeExpense(updatedExpense)).catch((e) => {
        console.error("Failed to update expense in Firestore:", e);
      });
    }

    void logActivity({
      action: "update",
      entity: "expense",
      entityId: updatedExpense.id,
      data: toExpenseLogData(updatedExpense),
    });
  }, []);

  const addPayment = useCallback((payment: Omit<Payment, "id">) => {
    const newPayment: Payment = {
      ...payment,
      id: crypto.randomUUID(),
    };
    setPayments((prev) => {
      const updated = [newPayment, ...prev];
      savePayments(updated);
      return updated;
    });
    if (isFirebaseConfigured && db) {
      const paymentsRef = collection(db, "payments");
      void setDoc(doc(paymentsRef, newPayment.id), serializePayment(newPayment)).catch((e) => {
        console.error("Failed to save payment to Firestore:", e);
      });
    }

    void logActivity({
      action: "create",
      entity: "payment",
      entityId: newPayment.id,
      data: toPaymentLogData(newPayment),
    });
  }, []);

  const deletePayment = useCallback((id: string) => {
    setPayments((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      savePayments(updated);
      return updated;
    });
    if (isFirebaseConfigured && db) {
      const paymentsRef = collection(db, "payments");
      void deleteDoc(doc(paymentsRef, id)).catch((e) => {
        console.error("Failed to delete payment from Firestore:", e);
      });
    }

    void logActivity({ action: "delete", entity: "payment", entityId: id });
  }, []);

  const updatePayment = useCallback((updatedPayment: Payment) => {
    setPayments((prev) => {
      const updated = prev.map((p) => (p.id === updatedPayment.id ? { ...p, ...updatedPayment } : p));
      savePayments(updated);
      return updated;
    });
    if (isFirebaseConfigured && db) {
      const paymentsRef = collection(db, "payments");
      void setDoc(doc(paymentsRef, updatedPayment.id), serializePayment(updatedPayment)).catch((e) => {
        console.error("Failed to update payment in Firestore:", e);
      });
    }

    void logActivity({
      action: "update",
      entity: "payment",
      entityId: updatedPayment.id,
      data: toPaymentLogData(updatedPayment),
    });
  }, []);

  const personBalances = useMemo((): Balance[] => {
    if (participants.length === 0) return [];

    const owedByPerson: Record<string, number> = {};
    for (const person of participants) {
      owedByPerson[person] = 0;
    }

    const getMembers = (entity: string): string[] => {
      const members = entityMembers[entity];
      if (members && members.length > 0) return members;
      return [entity];
    };

    for (const expense of expenses) {
      let eligible: string[] = [];

      if (expense.category === "eric-car" || expense.category === "leo-car") {
        const carId = expense.category as CarId;
        eligible = participants.filter((p) => participantCars[p] === carId);
      } else if (expense.category === "drinks") {
        eligible = participants.filter((p) => participantDrinks[p]);
      } else {
        eligible = [...participants];
      }

      if (eligible.length === 0) {
        eligible = [...participants];
      }

      const share = expense.amount / eligible.length;
      for (const person of eligible) {
        owedByPerson[person] += share;
      }
    }

    const transferDelta: Record<string, number> = {};
    const paymentsMade: Record<string, number> = {};
    const paymentsReceived: Record<string, number> = {};
    for (const person of participants) {
      transferDelta[person] = 0;
      paymentsMade[person] = 0;
      paymentsReceived[person] = 0;
    }
    for (const payment of payments) {
      const fromMembers = getMembers(payment.from).filter((m) => m in transferDelta);
      const toMembers = getMembers(payment.to).filter((m) => m in transferDelta);

      const fromShare = fromMembers.length > 0 ? payment.amount / fromMembers.length : 0;
      const toShare = toMembers.length > 0 ? payment.amount / toMembers.length : 0;

      for (const m of fromMembers) {
        transferDelta[m] += fromShare;
        paymentsMade[m] += fromShare;
      }
      for (const m of toMembers) {
        transferDelta[m] -= toShare;
        paymentsReceived[m] += toShare;
      }
    }

    return participants.map((person) => {
      const totalPaid = expenses
        .filter((e) => getMembers(e.paidBy).includes(person))
        .reduce((sum, e) => {
          const members = getMembers(e.paidBy).filter((m) => participants.includes(m));
          const share = members.length > 0 ? e.amount / members.length : 0;
          return sum + share;
        }, 0);

      const totalOwed = owedByPerson[person] ?? 0;
      const adjustment = transferDelta[person] ?? 0;
      const netBalance = totalPaid - totalOwed + adjustment;
      const totalPaymentsMade = paymentsMade[person] ?? 0;
      const totalPaymentsReceived = paymentsReceived[person] ?? 0;

      return {
        person,
        totalPaid,
        totalOwed,
        netBalance,
        totalPaymentsMade,
        totalPaymentsReceived,
      };
    });
  }, [entityMembers, expenses, participants, participantCars, participantDrinks, payments]);

  const groupBalances = useMemo((): Balance[] => {
    const participantMap = personBalances.reduce<Record<string, Balance>>((acc, b) => {
      acc[b.person] = b;
      return acc;
    }, {});

    return entities
      .filter((entity) => {
        const members = entityMembers[entity];
        return members && members.length > 1;
      })
      .map((entity) => {
        const members = entityMembers[entity] || [];
        const aggregated = members.reduce(
          (acc, m) => {
            const b = participantMap[m];
            if (!b) return acc;
            acc.totalPaid += b.totalPaid;
            acc.totalOwed += b.totalOwed;
            acc.netBalance += b.netBalance;
            acc.totalPaymentsMade += b.totalPaymentsMade;
            acc.totalPaymentsReceived += b.totalPaymentsReceived;
            return acc;
          },
          {
            totalPaid: 0,
            totalOwed: 0,
            netBalance: 0,
            totalPaymentsMade: 0,
            totalPaymentsReceived: 0,
          },
        );

        return {
          person: entity,
          ...aggregated,
        };
      });
  }, [entities, entityMembers, personBalances]);

  const balances = useMemo(() => [...groupBalances, ...personBalances], [groupBalances, personBalances]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const expensesByCategory = useMemo(() => {
    return expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);

  return {
    expenses,
    payments,
    addExpense,
    deleteExpense,
    updateExpense,
    addPayment,
    deletePayment,
    updatePayment,
    balances,
    personBalances,
    groupBalances,
    totalExpenses,
    expensesByCategory,
  };
}
