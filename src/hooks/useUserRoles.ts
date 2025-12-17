'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export function useUserRoles() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !firestore) {
            setRoles([]);
            setLoading(false);
            return;
        }

        const userRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setRoles(data.roles || []);
            } else {
                setRoles([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, firestore]);

    return { roles, loading };
}
