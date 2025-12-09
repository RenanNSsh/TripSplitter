import { useState, useCallback, useMemo, useEffect } from "react";
import { DEFAULT_PARTICIPANTS } from "@/types/expense";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, doc, getDocs, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";

type CarId = "eric-car" | "leo-car";

interface StoredParticipant {
  name: string;
  car?: CarId | null;
  finished?: boolean;
  drinks?: boolean;
}

const STORAGE_KEY = "travel-participants";

interface FirestoreParticipant {
  name: string;
  car: CarId | null;
  finished: boolean;
  drinks: boolean;
}

const inferDefaultCar = (name: string): CarId | null => {
  const lower = name.toLowerCase();
  if (lower === "eric") return "eric-car";
  if (lower === "léo") return "leo-car";
  return null;
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

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const participantsRef = collection(db, "participants");

    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const localParticipants = loadParticipants();
        const snap = await getDocs(participantsRef);

        if (snap.empty && localParticipants.length > 0) {
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
  }, []);

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
    addParticipant,
    removeParticipant,
    setParticipantCar,
    setParticipantFinished,
    setParticipantDrinks,
  };
}
