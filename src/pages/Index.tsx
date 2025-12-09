import { useExpenses } from "@/hooks/useExpenses";
import { useParticipants } from "@/hooks/useParticipants";
import { BalanceCard } from "@/components/BalanceCard";
import { ExpenseList } from "@/components/ExpenseList";
import { PaymentList } from "@/components/PaymentList";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { AddPaymentDialog } from "@/components/AddPaymentDialog";
import { SettlementSummary } from "@/components/SettlementSummary";
import { StatsHeader } from "@/components/StatsHeader";
import { ParticipantsManager } from "@/components/ParticipantsManager";
import { Car } from "lucide-react";

const Index = () => {
  const {
    participants,
    participantCars,
    participantFinished,
    participantDrinks,
    addParticipant,
    removeParticipant,
    setParticipantCar,
    setParticipantFinished,
    setParticipantDrinks,
  } = useParticipants();
  const {
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
  } = useExpenses(participants, participantCars, participantDrinks);

  const carEricTotal = expensesByCategory["eric-car"] || 0;
  const carLeoTotal = expensesByCategory["leo-car"] || 0;
  const carSum = carEricTotal + carLeoTotal;
  const adjustedTotalForAverage = totalExpenses - carSum + carSum / 2;
  const perPersonAverage =
    participants.length > 0 ? adjustedTotalForAverage / participants.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Car className="h-5 w-5" />
            <span className="font-medium">Controle de Despesas</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Divida os Custos da Viagem
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-4">
            Acompanhe as despesas entre os participantes e divida de forma justa.
          </p>
          
          <ParticipantsManager
            participants={participants}
            participantCars={participantCars}
            participantFinished={participantFinished}
            participantDrinks={participantDrinks}
            onAdd={addParticipant}
            onRemove={removeParticipant}
            onChangeCar={setParticipantCar}
            onSetFinished={setParticipantFinished}
            onSetDrinks={setParticipantDrinks}
          />
          <div className="mt-4 flex justify-center gap-4 flex-wrap">
            <AddExpenseDialog onAdd={addExpense} participants={participants} />
            <AddPaymentDialog onAdd={addPayment} participants={participants} />
          </div>
        </header>

        {/* Stats Header */}
        <section className="mb-8 animate-slide-up">
          <StatsHeader 
            totalExpenses={totalExpenses}
            expensesByCategory={expensesByCategory}
            perPersonAverage={perPersonAverage}
          />
        </section>

        {/* Balance Cards */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Saldos Individuais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {balances.map((balance) => (
              <BalanceCard key={balance.person} balance={balance} />
            ))}
          </div>
        </section>

        {/* Settlement Summary */}
        <section className="mb-8">
          <SettlementSummary balances={balances} />
        </section>

        {/* Expense List */}
        <section className="mb-8">
          <ExpenseList
            expenses={expenses}
            participants={participants}
            onDelete={deleteExpense}
            onUpdate={updateExpense}
            onAdd={addExpense}
          />
        </section>

        {/* Payments List */}
        <section>
          <PaymentList
            payments={payments}
            participants={participants}
            onDelete={deletePayment}
            onUpdate={updatePayment}
            onAdd={addPayment}
          />
        </section>
      </div>
    </div>
  );
};

export default Index;
