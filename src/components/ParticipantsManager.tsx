import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Users, Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ParticipantGroup } from "@/hooks/useParticipants";

type CarId = "eric-car" | "leo-car";

interface ParticipantsManagerProps {
  participants: string[];
  participantCars: Record<string, CarId | null>;
  participantFinished: Record<string, boolean>;
  participantDrinks: Record<string, boolean>;
  groups: ParticipantGroup[];
  onAddGroup: (name: string, members: string[]) => boolean;
  onRemoveGroup: (id: string) => void;
  onAdd: (name: string, car: CarId | null) => boolean;
  onRemove: (name: string) => void;
  onChangeCar: (name: string, car: CarId | null) => void;
  onSetFinished: (name: string, finished: boolean) => void;
  onSetDrinks: (name: string, drinks: boolean) => void;
}

export function ParticipantsManager({
  participants,
  participantCars,
  participantFinished,
  participantDrinks,
  groups,
  onAddGroup,
  onRemoveGroup,
  onAdd,
  onRemove,
  onChangeCar,
  onSetFinished,
  onSetDrinks,
}: ParticipantsManagerProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCar, setNewCar] = useState<CarId>("eric-car");
  const [newDrinks, setNewDrinks] = useState<boolean>(true);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});

  const availableForGrouping = useMemo(() => {
    const grouped = new Set(groups.flatMap((g) => g.members.map((m) => m.toLowerCase())));
    return participants.filter((p) => !grouped.has(p.toLowerCase()));
  }, [groups, participants]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    
    if (!trimmed) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome válido",
        variant: "destructive",
      });
      return;
    }

    if (participants.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: "Participante já existe",
        description: "Esse nome já está na lista",
        variant: "destructive",
      });
      return;
    }

    const created = onAdd(trimmed, newCar);
    if (!created) {
      return;
    }
    if (!newDrinks) {
      onSetDrinks(trimmed, false);
    }
    setNewName("");
    setNewCar("eric-car");
    setNewDrinks(true);
    toast({
      title: "Participante adicionado",
      description: `${trimmed} foi adicionado à viagem`,
    });
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const members = Object.entries(selectedMembers)
      .filter(([, checked]) => checked)
      .map(([name]) => name);
    if (members.length < 2) {
      toast({
        title: "Selecione pelo menos 2 pessoas",
        description: "Um grupo precisa ter duas ou mais pessoas",
        variant: "destructive",
      });
      return;
    }
    const created = onAddGroup(groupName, members);
    if (!created) {
      toast({
        title: "Não foi possível criar o grupo",
        description: "Verifique se o nome é único e os membros não estão em outro grupo",
        variant: "destructive",
      });
      return;
    }
    setGroupName("");
    setSelectedMembers({});
    toast({
      title: "Grupo criado",
      description: `${groupName} agrupou ${members.join(", ")}`,
    });
  };

  const handleRemove = (name: string) => {
    if (participants.length <= 2) {
      toast({
        title: "Mínimo de participantes",
        description: "É necessário ter pelo menos 2 participantes",
        variant: "destructive",
      });
      return;
    }
    onRemove(name);
    toast({
      title: "Participante removido",
      description: `${name} foi removido da viagem`,
    });
  };

  const toggleMember = (name: string) => {
    setSelectedMembers((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          {participants.length} Participantes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[calc(100vh-3rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Participantes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4 pr-1">
          <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Nome do participante"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={30}
              className="w-full sm:flex-1 min-w-0"
            />
            <Select value={newCar} onValueChange={(v) => setNewCar(v as CarId)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Carro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eric-car">Carro do Eric</SelectItem>
                <SelectItem value="leo-car">Carro do Leo</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={newDrinks ? "secondary" : "outline"}
              size="sm"
              className="w-[110px] justify-center"
              onClick={() => setNewDrinks((prev) => !prev)}
            >
              {newDrinks ? "Bebe" : "Não bebe"}
            </Button>
            <Button type="submit" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
          
          <div className="space-y-2 pr-1">
            {participants.map((person) => (
              <div
                key={person}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3 w-full sm:flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {person[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground min-w-0 truncate">{person}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 mt-1 sm:mt-0 w-full sm:w-auto">
                  <Select
                    value={(participantCars[person] ?? "eric-car") as CarId}
                    onValueChange={(v) => onChangeCar(person, v as CarId)}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Carro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eric-car">Carro do Eric</SelectItem>
                      <SelectItem value="leo-car">Carro do Leo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant={participantDrinks[person] ? "secondary" : "outline"}
                    size="sm"
                    className="w-full sm:w-[110px] justify-center"
                    onClick={() => onSetDrinks(person, !participantDrinks[person])}
                  >
                    {participantDrinks[person] ? "Bebe" : "Não bebe"}
                  </Button>
                  <Button
                    variant={participantFinished[person] ? "success" : "outline"}
                    size="sm"
                    className="w-full sm:w-[120px] justify-center"
                    onClick={() => onSetFinished(person, !participantFinished[person])}
                  >
                    {participantFinished[person] ? "Finalizado" : "Aberto"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(person)}
                    disabled={participants.length <= 2}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-border/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Grupos</h4>
                <p className="text-xs text-muted-foreground">
                  Agrupe participantes para compartilhar despesas e pagamentos
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{groups.length} grupo{groups.length === 1 ? "" : "s"}</span>
            </div>

            <form onSubmit={handleAddGroup} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Nome do grupo (ex: Família)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={30}
                className="w-full sm:flex-1 min-w-0"
              />
              <Button type="submit" size="sm" className="w-full sm:w-auto gap-2">
                <Plus className="h-4 w-4" />
                Criar grupo
              </Button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2 rounded-lg border border-border/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Disponíveis</p>
                {availableForGrouping.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum participante livre</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableForGrouping.map((person) => (
                      <Button
                        key={person}
                        type="button"
                        size="sm"
                        variant={selectedMembers[person] ? "default" : "outline"}
                        onClick={() => toggleMember(person)}
                        className="rounded-full"
                      >
                        {person}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-lg border border-border/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Grupos existentes</p>
                {groups.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum grupo criado</p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-start justify-between gap-2 bg-muted/50 p-2 rounded-lg"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{group.name}</p>
                          <p className="text-xs text-muted-foreground">Membros: {group.members.join(", ")}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveGroup(group.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
