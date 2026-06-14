import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { artifactsData } from '../data/artifacts';
import { artifactVideos } from '../data/videos';

const ArtifactContext = createContext();

export const useArtifacts = () => useContext(ArtifactContext);

// Normalize static data to match Firestore format
const normalizeStaticData = () => {
  return artifactsData.map((a) => {
    const video = artifactVideos.find((v) => v.id === a.id);
    return {
      docId: null,
      artifactId: a.id,
      id: a.id,
      name: a.name,
      origin: a.origin || '',
      period: a.period || '',
      material: a.material || '',
      description: a.description || '',
      modelUrl: a.modelUrl || '',
      textureUrl: a.textureUrl || '',
      videoUrl: video?.videoUrl || '',
      videoTitle: video?.title || '',
      imageUrl: '',
    };
  });
};

export const ArtifactProvider = ({ children }) => {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firestoreReady, setFirestoreReady] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe = null;

    const initData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'artifacts'));
        if (snapshot.empty && active) {
          console.log('Firestore is empty. Automatically seeding default data...');
          const staticData = normalizeStaticData();
          for (const artifact of staticData) {
            await addDoc(collection(db, 'artifacts'), {
              artifactId: artifact.artifactId,
              name: artifact.name,
              origin: artifact.origin,
              period: artifact.period,
              material: artifact.material,
              description: artifact.description,
              modelUrl: artifact.modelUrl,
              textureUrl: artifact.textureUrl,
              videoUrl: artifact.videoUrl,
              videoTitle: artifact.videoTitle,
              imageUrl: artifact.imageUrl,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          console.log('Automatic seeding completed.');
        }
      } catch (err) {
        console.error('Error during auto-seeding or check:', err);
      }

      if (!active) return;

      const q = query(collection(db, 'artifacts'), orderBy('createdAt', 'asc'));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setFirestoreReady(true);
          if (snapshot.empty) {
            // Fallback to static default data when Firestore is empty
            setArtifacts(normalizeStaticData());
          } else {
            const docs = snapshot.docs.map((d) => ({
              ...d.data(),
              docId: d.id,
              id: d.data().artifactId, // normalize so LiveCamera can use a.id
            }));
            setArtifacts(docs);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Firestore error:', error);
          // Fallback to static data on error
          setArtifacts(normalizeStaticData());
          setLoading(false);
        }
      );
    };

    initData();

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const addArtifact = async (data) => {
    const docRef = await addDoc(collection(db, 'artifacts'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updateArtifact = async (docId, data) => {
    await updateDoc(doc(db, 'artifacts', docId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteArtifact = async (docId) => {
    await deleteDoc(doc(db, 'artifacts', docId));
  };

  // Seed Firestore with default static data (only if empty)
  const seedDefaultData = async () => {
    const snapshot = await getDocs(collection(db, 'artifacts'));
    if (!snapshot.empty) {
      throw new Error('Firestore đã có dữ liệu. Không thể khởi tạo lại.');
    }
    const staticData = normalizeStaticData();
    for (const artifact of staticData) {
      await addDoc(collection(db, 'artifacts'), {
        artifactId: artifact.artifactId,
        name: artifact.name,
        origin: artifact.origin,
        period: artifact.period,
        material: artifact.material,
        description: artifact.description,
        modelUrl: artifact.modelUrl,
        textureUrl: artifact.textureUrl,
        videoUrl: artifact.videoUrl,
        videoTitle: artifact.videoTitle,
        imageUrl: artifact.imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  return (
    <ArtifactContext.Provider
      value={{
        artifacts,
        loading,
        firestoreReady,
        addArtifact,
        updateArtifact,
        deleteArtifact,
        seedDefaultData,
      }}
    >
      {children}
    </ArtifactContext.Provider>
  );
};
