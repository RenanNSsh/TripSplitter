import { useMemo, useState } from "react";
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
    groups,
    entities,
    entityMembers,
    addParticipant,
    removeParticipant,
    setParticipantCar,
    setParticipantFinished,
    setParticipantDrinks,
    addGroup,
    removeGroup,
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
    personBalances,
    groupBalances,
    totalExpenses,
    expensesByCategory,
  } = useExpenses(participants, participantCars, participantDrinks, entities, entityMembers);

  const [showIndividuals, setShowIndividuals] = useState(false);

  const groupedMembers = useMemo(
    () => new Set(groups.flatMap((g) => g.members.map((m) => m.toLowerCase()))),
    [groups],
  );

  const visibleBalances = useMemo(() => {
    if (showIndividuals || groupBalances.length === 0) {
      return personBalances;
    }
    const ungrouped = personBalances.filter((p) => !groupedMembers.has(p.person.toLowerCase()));
    return [...groupBalances, ...ungrouped];
  }, [groupBalances, personBalances, showIndividuals, groupedMembers]);

  const carEricTotal = expensesByCategory["eric-car"] || 0;
  const carLeoTotal = expensesByCategory["leo-car"] || 0;
  const carSum = carEricTotal + carLeoTotal;
  const adjustedTotalForAverage = totalExpenses;
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
            groups={groups}
            onAddGroup={addGroup}
            onRemoveGroup={removeGroup}
            onAdd={addParticipant}
            onRemove={removeParticipant}
            onChangeCar={setParticipantCar}
            onSetFinished={setParticipantFinished}
            onSetDrinks={setParticipantDrinks}
          />
          <div className="mt-4 flex justify-center gap-4 flex-wrap">
            <AddExpenseDialog onAdd={addExpense} entities={entities} entityMembers={entityMembers} />
            <AddPaymentDialog onAdd={addPayment} entities={entities} entityMembers={entityMembers} />
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Saldos e Grupos
              </h2>
              <p className="text-sm text-muted-foreground">
                Visualize por grupos ou individualmente
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIndividuals((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition ${
                showIndividuals
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-foreground border-border"
              }`}
            >
              {showIndividuals ? "Mostrar grupos" : "Mostrar dados individuais"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleBalances.map((balance) => (
              <BalanceCard
                key={balance.person}
                balance={balance}
                members={entityMembers[balance.person]}
              />
            ))}
          </div>
        </section>

        {/* Settlement Summary */}
        <section className="mb-8">
          <SettlementSummary
            balances={visibleBalances}
            entityMembers={entityMembers}
            useGroups={!showIndividuals && groupBalances.length > 0}
          />
        </section>

        {/* Expense List */}
        <section className="mb-8">
          <ExpenseList
            expenses={expenses}
            entities={entities}
            entityMembers={entityMembers}
            onDelete={deleteExpense}
            onUpdate={updateExpense}
            onAdd={addExpense}
          />
        </section>

        {/* Payments List */}
        <section>
          <PaymentList
            payments={payments}
            entities={entities}
            entityMembers={entityMembers}
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
