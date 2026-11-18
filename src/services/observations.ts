import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { firestore } from '../firebase';

export type Observation = {
  id: string;
  title: string;
  notes: string;
  bodyId: string;
  bodyName: string;
  bodyType: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type ObservationDraft = Omit<Observation, 'id' | 'createdAt' | 'updatedAt'>;

function observationsCollection(uid: string) {
  if (!firestore) throw new Error('O Firebase ainda não está configurado.');
  return collection(firestore, 'users', uid, 'observations');
}

export function subscribeObservations(
  uid: string,
  onData: (observations: Observation[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    observationsCollection(uid),
    (snapshot) => {
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Observation);
      items.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      onData(items);
    },
    (error) => onError(error),
  );
}

export async function createObservation(uid: string, draft: ObservationDraft) {
  await addDoc(observationsCollection(uid), {
    ...draft,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateObservation(uid: string, id: string, draft: ObservationDraft) {
  if (!firestore) throw new Error('O Firebase ainda não está configurado.');
  await updateDoc(doc(firestore, 'users', uid, 'observations', id), {
    ...draft,
    updatedAt: serverTimestamp(),
  });
}

export async function removeObservation(uid: string, id: string) {
  if (!firestore) throw new Error('O Firebase ainda não está configurado.');
  await deleteDoc(doc(firestore, 'users', uid, 'observations', id));
}
