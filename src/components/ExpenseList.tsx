import { useState } from "react";
import { Expense, Category, CATEGORIES, Attachment } from "@/types/expense";
import { ExpenseItem } from "./ExpenseItem";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { AttachmentDropzone } from "./AttachmentDropzone";
import { Plus } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

interface ExpenseListProps {
	expenses: Expense[];
	entities: string[];
	entityMembers: Record<string, string[]>;
	onDelete: (id: string) => void;
	onUpdate: (expense: Expense) => void;
	onAdd: (expense: Omit<Expense, "id">) => void;
}

export function ExpenseList({ expenses, entities, entityMembers, onDelete, onUpdate, onAdd }: ExpenseListProps) {
	const [filter, setFilter] = useState<Category | "all">("all");
	const [editing, setEditing] = useState<Expense | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [editAmount, setEditAmount] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [editCategory, setEditCategory] = useState<Category>("general");
	const [editPaidBy, setEditPaidBy] = useState<string>("");
	const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);
	
	const filteredExpenses =
		filter === "all" ? expenses : expenses.filter((e) => e.category === filter);

	const startEdit = (expense: Expense) => {
		setEditing(expense);
		setEditAmount(expense.amount.toString());
		setEditDescription(expense.description);
		setEditCategory(expense.category);
		setEditPaidBy(expense.paidBy);
		if (expense.attachments && expense.attachments.length > 0) {
			setEditAttachments(expense.attachments);
		} else if (expense.attachmentName && expense.attachmentDataUrl) {
			setEditAttachments([{ name: expense.attachmentName, dataUrl: expense.attachmentDataUrl }]);
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

		if (!editDescription.trim()) {
			toast({
				title: "Descrição obrigatória",
				description: "Por favor, insira uma descrição para a despesa",
				variant: "destructive",
			});
			return;
		}

		if (!editPaidBy) {
			toast({
				title: "Pagador obrigatório",
				description: "Por favor, selecione quem pagou",
				variant: "destructive",
			});
			return;
		}

		onUpdate({
			...editing,
			amount: parsedAmount,
			description: editDescription.trim(),
			category: editCategory,
			paidBy: editPaidBy,
			attachments: editAttachments,
			attachmentName: editAttachments[0]?.name,
			attachmentDataUrl: editAttachments[0]?.dataUrl,
		});

		toast({
			title: "Despesa atualizada",
			description: `R$ ${parsedAmount.toFixed(2)} em ${CATEGORIES[editCategory].label}`,
		});

		setEditOpen(false);
		setEditing(null);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h2 className="text-xl font-semibold text-foreground">Despesas</h2>
					<AddExpenseDialog
						onAdd={onAdd}
						entities={entities}
						entityMembers={entityMembers}
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
					{filteredExpenses.length} despesa
					{filteredExpenses.length !== 1 ? "s" : ""}
				</span>
			</div>
			
			<div className="flex flex-wrap gap-2">
				<Button
					variant={filter === "all" ? "default" : "outline"}
					size="sm"
					onClick={() => setFilter("all")}
					className="rounded-full"
				>
					Todas
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
				{filteredExpenses.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						<p className="text-lg">Nenhuma despesa ainda</p>
						<p className="text-sm mt-1">Adicione sua primeira despesa para começar</p>
					</div>
				) : (
					filteredExpenses.map((expense) => (
						<ExpenseItem
								key={expense.id}
								expense={expense}
								onDelete={onDelete}
								onEdit={() => startEdit(expense)}
							/>
					))
				)}
			</div>

			<Dialog
				open={editOpen}
				onOpenChange={(open) => {
					setEditOpen(open);
					if (!open) setEditing(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Editar Despesa</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleEditSubmit} className="space-y-5 mt-4">
						<div className="space-y-2">
							<Label htmlFor="edit-amount">Valor (R$)</Label>
							<Input
								id="edit-amount"
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
							<Label htmlFor="edit-description">Descrição</Label>
							<Input
								id="edit-description"
								placeholder="Para que foi essa despesa?"
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

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-category">Categoria</Label>
								<Select value={editCategory} onValueChange={(v) => setEditCategory(v as Category)}>
									<SelectTrigger id="edit-category">
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

							<div className="space-y-2">
								<Label htmlFor="edit-paidBy">Pago por</Label>
								<Select value={editPaidBy} onValueChange={setEditPaidBy}>
									<SelectTrigger id="edit-paidBy">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{entities.map((entity) => (
											<SelectItem key={entity} value={entity}>
												{entityMembers[entity]?.length > 1 ? `${entity} (grupo)` : entity}
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
