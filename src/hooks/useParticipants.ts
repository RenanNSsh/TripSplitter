import { useState, useCallback, useMemo, useEffect } from "react";
import { DEFAULT_PARTICIPANTS } from "@/types/expense";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, doc, getDocs, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { logActivity } from "@/lib/telemetry";

type CarId = "eric-car" | "leo-car";

interface StoredParticipant {
  name: string;
  car?: CarId | null;
  finished?: boolean;
  drinks?: boolean;
}

export interface ParticipantGroup {
  id: string;
  name: string;
  members: string[];
}

const STORAGE_KEY = "travel-participants";
const GROUPS_STORAGE_KEY = "travel-participant-groups";

interface FirestoreParticipant {
  name: string;
  car: CarId | null;
  finished: boolean;
  drinks: boolean;
}

const toParticipantLogData = (participant: StoredParticipant) => ({
  name: participant.name,
  car: participant.car ?? null,
  finished: participant.finished ?? false,
  drinks: participant.drinks ?? true,
});

const inferDefaultCar = (name: string): CarId | null => {
  const lower = name.toLowerCase();
  if (lower === "eric") return "eric-car";
  if (lower === "léo") return "leo-car";
  return null;
};

const loadGroups = (): ParticipantGroup[] => {
  try {
    const stored = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter((g) => g && typeof g.name === "string" && Array.isArray(g.members));
      }
    }
  } catch (e) {
    console.error("Failed to load participant groups:", e);
  }
  return [];
};

const saveGroups = (groups: ParticipantGroup[]) => {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch (e) {
    console.error("Failed to save participant groups:", e);
  }
};

const loadParticipants = (): StoredParticipant[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === "string") {
          return parsed.map((name: string) => ({
            name,
            car: inferDefaultCar(name),
            finished: false,
            drinks: true,
          }));
        }

        if (typeof parsed[0] === "object" && parsed[0] !== null && "name" in parsed[0]) {
          return (parsed as StoredParticipant[]).map((p) => ({
            name: p.name,
            car: p.car ?? inferDefaultCar(p.name),
            finished: p.finished ?? false,
            drinks: p.drinks ?? true,
          }));
        }
      }
    }
  } catch (e) {
    console.error("Failed to load participants:", e);
  }

  return DEFAULT_PARTICIPANTS.map((name) => ({
    name,
    car: inferDefaultCar(name),
    finished: false,
    drinks: true,
  }));
};

const saveParticipants = (participants: StoredParticipant[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
  } catch (e) {
    console.error("Failed to save participants:", e);
  }
};

export function useParticipants() {
  const [participants, setParticipants] = useState<StoredParticipant[]>(loadParticipants);
  const [groups, setGroups] = useState<ParticipantGroup[]>(loadGroups);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const participantsRef = collection(db, "participants");

    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const localParticipants = loadParticipants();
        const snap = await getDocs(participantsRef);

        if (snap.empty && localParticipants.length > 0) {
          void logActivity({
            action: "seed",
            entity: "participants",
            data: { count: localParticipants.length },
          });
          await Promise.all(
            localParticipants.map((p) =>
              setDoc(doc(participantsRef, p.name), {
                name: p.name,
                car: p.car ?? inferDefaultCar(p.name),
                finished: p.finished ?? false,
                drinks: p.drinks ?? true,
              }),
            ),
          );
        }

        unsubscribe = onSnapshot(
          participantsRef,
          (snapshot) => {
            const remote: StoredParticipant[] = snapshot.docs.map((d) => {
              const data = d.data() as Partial<FirestoreParticipant>;
              const name = data.name ?? d.id;
              return {
                name,
                car: (data.car as CarId | null | undefined) ?? inferDefaultCar(name),
                finished: data.finished ?? false,
                drinks: data.drinks ?? true,
              };
            });
            setParticipants(remote);
            saveParticipants(remote);
          },
          (error) => {
            console.error("Firestore participants subscription error:", error);
          },
        );
      } catch (e) {
        console.error("Failed to sync participants with Firestore:", e);
      }
    })();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const addParticipant = useCallback((name: string, car?: CarId | null) => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;

    const effectiveCar = car ?? inferDefaultCar(trimmedName);

    setParticipants((prev) => {
      if (prev.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        return prev;
      }
      const updated = [...prev, { name: trimmedName, car: effectiveCar, finished: false, drinks: true }];
      saveParticipants(updated);
      if (isFirebaseConfigured && db) {
        const participantsRef = collection(db, "participants");
        const newParticipant = updated.find(
          (p) => p.name.toLowerCase() === trimmedName.toLowerCase(),
        );
        if (newParticipant) {
          void setDoc(doc(participantsRef, newParticipant.name), {
            name: newParticipant.name,
            car: newParticipant.car ?? inferDefaultCar(newParticipant.name),
            finished: newParticipant.finished ?? false,
            drinks: newParticipant.drinks ?? true,
          }).catch((e) => {
            console.error("Failed to save participant to Firestore:", e);
          });
        }
      }
      return updated;
    });

    void logActivity({
      action: "create",
      entity: "participant",
      entityId: trimmedName,
      data: toParticipantLogData({ name: trimmedName, car: effectiveCar, finished: false, drinks: true }),
    });
    return true;
  }, []);

  const removeParticipant = useCallback((name: string) => {
    setParticipants((prev) => {
      if (prev.length <= 2) return prev; // Keep at least 2 participants
      const updated = prev.filter((p) => p.name !== name);
      saveParticipants(updated);
      if (isFirebaseConfigured && db) {
        const participantsRef = collection(db, "participants");
        void deleteDoc(doc(participantsRef, name)).catch((e) => {
          console.error("Failed to delete participant from Firestore:", e);
        });
      }
      return updated;
    });

    setGroups((prev) => {
      const updatedGroups = prev
        .map((g) => ({ ...g, members: g.members.filter((m) => m !== name) }))
        .filter((g) => g.members.length > 0);
      saveGroups(updatedGroups);
      return updatedGroups;
    });

    void logActivity({ action: "delete", entity: "participant", entityId: name });
  }, []);

  const setParticipantCar = useCallback((name: string, car: CarId | null) => {
    setParticipants((prev) => {
      const updated = prev.map((p) =>
        p.name === name
          ? {
              ...p,
              car,
            }
          : p,
      );
      saveParticipants(updated);
      if (isFirebaseConfigured && db) {
        const participantsRef = collection(db, "participants");
        const updatedParticipant = updated.find((p) => p.name === name);
        if (updatedParticipant) {
          void setDoc(doc(participantsRef, name), {
            name: updatedParticipant.name,
            car: updatedParticipant.car ?? inferDefaultCar(updatedParticipant.name),
            finished: updatedParticipant.finished ?? false,
            drinks: updatedParticipant.drinks ?? true,
          }).catch((e) => {
            console.error("Failed to update participant car in Firestore:", e);
          });
        }
      }
      return updated;
    });

    void logActivity({
      action: "update",
      entity: "participant",
      entityId: name,
      data: { car },
    });
  }, []);

  const setParticipantFinished = useCallback((name: string, finished: boolean) => {
    setParticipants((prev) => {
      const updated = prev.map((p) =>
        p.name === name
          ? {
              ...p,
              finished,
            }
          : p,
      );
      saveParticipants(updated);
      if (isFirebaseConfigured && db) {
        const participantsRef = collection(db, "participants");
        const updatedParticipant = updated.find((p) => p.name === name);
        if (updatedParticipant) {
          void setDoc(doc(participantsRef, name), {
            name: updatedParticipant.name,
            car: updatedParticipant.car ?? inferDefaultCar(updatedParticipant.name),
            finished: updatedParticipant.finished ?? false,
            drinks: updatedParticipant.drinks ?? true,
          }).catch((e) => {
            console.error("Failed to update participant finished in Firestore:", e);
          });
        }
      }
      return updated;
    });

    void logActivity({
      action: "update",
      entity: "participant",
      entityId: name,
      data: { finished },
    });
  }, []);

  const setParticipantDrinks = useCallback((name: string, drinks: boolean) => {
    setParticipants((prev) => {
      const updated = prev.map((p) =>
        p.name === name
          ? {
              ...p,
              drinks,
            }
          : p,
      );
      saveParticipants(updated);
      if (isFirebaseConfigured && db) {
        const participantsRef = collection(db, "participants");
        const updatedParticipant = updated.find((p) => p.name === name);
        if (updatedParticipant) {
          void setDoc(doc(participantsRef, name), {
            name: updatedParticipant.name,
            car: updatedParticipant.car ?? inferDefaultCar(updatedParticipant.name),
            finished: updatedParticipant.finished ?? false,
            drinks: updatedParticipant.drinks ?? true,
          }).catch((e) => {
            console.error("Failed to update participant drinks in Firestore:", e);
          });
        }
      }
      return updated;
    });

    void logActivity({
      action: "update",
      entity: "participant",
      entityId: name,
      data: { drinks },
    });
  }, []);

  const addGroup = useCallback(
    (name: string, members: string[]) => {
      const trimmedName = name.trim();
      const uniqueMembers = Array.from(new Set(members.map((m) => m.trim()).filter(Boolean)));
      if (!trimmedName || uniqueMembers.length < 2) return false;

      const lowerName = trimmedName.toLowerCase();
      if (
        groups.some((g) => g.name.toLowerCase() === lowerName) ||
        participants.some((p) => p.name.toLowerCase() === lowerName)
      ) {
        return false;
      }

      // Avoid grouping someone twice
      const alreadyGrouped = new Set(groups.flatMap((g) => g.members.map((m) => m.toLowerCase())));
      if (uniqueMembers.some((m) => alreadyGrouped.has(m.toLowerCase()))) {
        return false;
      }

      const allExist = uniqueMembers.every((m) =>
        participants.some((p) => p.name.toLowerCase() === m.toLowerCase()),
      );
      if (!allExist) return false;

      const newGroup: ParticipantGroup = {
        id: crypto.randomUUID(),
        name: trimmedName,
        members: uniqueMembers,
      };

      setGroups((prev) => {
        const updated = [...prev, newGroup];
        saveGroups(updated);
        return updated;
      });
      return true;
    },
    [groups, participants],
  );

  const removeGroup = useCallback((groupId: string) => {
    setGroups((prev) => {
      const updated = prev.filter((g) => g.id !== groupId);
      saveGroups(updated);
      return updated;
    });
  }, []);

  const groupedMembers = useMemo(() => new Set(groups.flatMap((g) => g.members)), [groups]);

  const entities = useMemo(
    () => [
      ...groups.map((g) => g.name),
      ...participants.filter((p) => !groupedMembers.has(p.name)).map((p) => p.name),
    ],
    [groups, participants, groupedMembers],
  );

  const entityMembers = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const p of participants) {
      map[p.name] = [p.name];
    }
    for (const g of groups) {
      map[g.name] = g.members;
    }
    return map;
  }, [participants, groups]);

  const participantNames = useMemo(() => participants.map((p) => p.name), [participants]);

  const participantCars = useMemo(
    () =>
      participants.reduce((acc, p) => {
        acc[p.name] = p.car ?? null;
        return acc;
      }, {} as Record<string, CarId | null>),
    [participants]
  );

  const participantFinished = useMemo(
    () =>
      participants.reduce((acc, p) => {
        acc[p.name] = !!p.finished;
        return acc;
      }, {} as Record<string, boolean>),
    [participants]
  );

  const participantDrinks = useMemo(
    () =>
      participants.reduce((acc, p) => {
        acc[p.name] = p.drinks ?? true;
        return acc;
      }, {} as Record<string, boolean>),
    [participants]
  );

  return {
    participants: participantNames,
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
  };
}
