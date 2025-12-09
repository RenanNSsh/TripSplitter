import { useState, useCallback, useMemo, useEffect } from "react";
import { Expense, Balance, Payment } from "@/types/expense";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, doc, getDocs, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";

type CarId = "eric-car" | "leo-car";

const STORAGE_KEY = "travel-expenses";
const PAYMENTS_STORAGE_KEY = "travel-payments";

type FirestoreExpense = Omit<Expense, "date"> & { date: string };
type FirestorePayment = Omit<Payment, "date"> & { date: string };

const serializeExpense = (expense: Expense): FirestoreExpense => ({
  ...expense,
  date: expense.date.toISOString(),
});

const deserializeExpense = (data: FirestoreExpense): Expense => ({
  ...data,
  date: new Date(data.date),
});

const serializePayment = (payment: Payment): FirestorePayment => ({
  ...payment,
  date: payment.date.toISOString(),
});

const deserializePayment = (data: FirestorePayment): Payment => ({
  ...data,
  date: new Date(data.date),
});

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
          await Promise.all(
            localExpenses.map((expense) =>
              setDoc(doc(expensesRef, expense.id), serializeExpense(expense)),
            ),
          );
        }

        if (paymentsSnap.empty && localPayments.length > 0) {
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
  }, []);

  const balances = useMemo((): Balance[] => {
    if (participants.length === 0) return [];

    const owedByPerson: Record<string, number> = {};
    for (const person of participants) {
      owedByPerson[person] = 0;
    }

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
      if (!(payment.from in transferDelta)) {
        transferDelta[payment.from] = 0;
        paymentsMade[payment.from] = 0;
      }
      if (!(payment.to in transferDelta)) {
        transferDelta[payment.to] = 0;
        paymentsReceived[payment.to] = 0;
      }
      transferDelta[payment.from] += payment.amount;
      transferDelta[payment.to] -= payment.amount;
      paymentsMade[payment.from] += payment.amount;
      paymentsReceived[payment.to] += payment.amount;
    }

    return participants.map((person) => {
      const totalPaid = expenses
        .filter((e) => e.paidBy === person)
        .reduce((sum, e) => sum + e.amount, 0);

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
  }, [expenses, participants, participantCars, participantDrinks, payments]);

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
    totalExpenses,
    expensesByCategory,
  };
}
