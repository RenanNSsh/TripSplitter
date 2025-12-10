import { useState } from "react";
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

type CarId = "eric-car" | "leo-car";

interface ParticipantsManagerProps {
  participants: string[];
  participantCars: Record<string, CarId | null>;
  participantFinished: Record<string, boolean>;
  participantDrinks: Record<string, boolean>;
  onAdd: (name: string, car: CarId | null) => boolean;
  onRemove: (name: string) => void;
  onChangeCar: (name: string, car: CarId | null) => void;
  onSetFinished: (name: string, finished: boolean) => void;
  onSetDrinks: (name: string, drinks: boolean) => void;
}

export function ParticipantsManager({ participants, participantCars, participantFinished, participantDrinks, onAdd, onRemove, onChangeCar, onSetFinished, onSetDrinks }: ParticipantsManagerProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCar, setNewCar] = useState<CarId>("eric-car");
  const [newDrinks, setNewDrinks] = useState<boolean>(true);

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
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {person[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">{person}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                  <Select
                    value={(participantCars[person] ?? "eric-car") as CarId}
                    onValueChange={(v) => onChangeCar(person, v as CarId)}
                  >
                    <SelectTrigger className="w-[200px]">
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
                    className="w-[110px] justify-center"
                    onClick={() => onSetDrinks(person, !participantDrinks[person])}
                  >
                    {participantDrinks[person] ? "Bebe" : "Não bebe"}
                  </Button>
                  <Button
                    variant={participantFinished[person] ? "success" : "outline"}
                    size="sm"
                    className="w-[120px] justify-center"
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
          
          <p className="text-xs text-muted-foreground text-center">
            Mínimo de 2 participantes necessários
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
