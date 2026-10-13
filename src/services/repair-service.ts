import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';

import { firestore } from '../../firebaseConfig';
import { supabaseStorage } from '../lib/supabase-storage';

const REPAIRS_COLLECTION = 'repairs';
const REPAIR_IMAGE_BUCKET = 'repair-images';

export type RepairStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'ready_for_release'
  | 'claimed'
  | 'cancelled';

export type RepairRequest = {
  id: string;
  repair_number: string;
  user_id: string;
  service_type: string;
  jewelry_type: string;
  issue_description: string;
  damage_photo_url: string | null;
  damage_photo_path: string | null;
  preferred_date: Date;
  preferred_time: string;
  status: RepairStatus;
  estimated_cost: number | null;
  deposit: number;
  balance: number | null;
  created_at: Date;
};

export type CreateRepairInput = {
  uid: string;
  serviceType: string;
  jewelryType: string;
  issueDescription: string;
  preferredDate: Date;
  preferredTime: string;
};

type UploadedPhoto = {
  path: string;
  url: string;
};

async function getImageBytes(asset: ImagePickerAsset) {
  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    return response.arrayBuffer();
  }

  return new File(asset.uri).arrayBuffer();
}

async function uploadDamagePhoto(
  uid: string,
  asset: ImagePickerAsset
): Promise<UploadedPhoto> {
  const extensionFromName = asset.fileName
    ?.split('.')
    .pop()
    ?.toLowerCase();

  const extension =
    extensionFromName &&
    ['jpg', 'jpeg', 'png', 'webp'].includes(extensionFromName)
      ? extensionFromName
      : 'jpg';

  const path =
    `repairs/${uid}/${Date.now()}-` +
    `${Math.random().toString(36).slice(2)}.${extension}`;

  const contentType =
    asset.mimeType ??
    (extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg');

  const { error } = await supabaseStorage.storage
    .from(REPAIR_IMAGE_BUCKET)
    .upload(path, await getImageBytes(asset), {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Damage photo upload failed: ${error.message}`);
  }

  const { data } = supabaseStorage.storage
    .from(REPAIR_IMAGE_BUCKET)
    .getPublicUrl(path);

  return {
    path,
    url: data.publicUrl,
  };
}

function generateRepairNumber() {
  const year = new Date().getFullYear();
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase();

  return `REP-${year}-${randomPart}`;
}

export async function createRepairRequest(
  input: CreateRepairInput,
  damagePhoto: ImagePickerAsset | null
) {
  let uploadedPhoto: UploadedPhoto | null = null;

  try {
    if (damagePhoto) {
      uploadedPhoto = await uploadDamagePhoto(
        input.uid,
        damagePhoto
      );
    }

    const document = await addDoc(
      collection(firestore, REPAIRS_COLLECTION),
      {
        repair_number: generateRepairNumber(),
        user_id: input.uid,
        service_type: input.serviceType,
        jewelry_type: input.jewelryType,
        issue_description: input.issueDescription,
        damage_photo_url: uploadedPhoto?.url ?? null,
        damage_photo_path: uploadedPhoto?.path ?? null,
        preferred_date: Timestamp.fromDate(input.preferredDate),
        preferred_time: input.preferredTime,
        status: 'pending',
        estimated_cost: null,
        deposit: 0,
        balance: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }
    );

    return document.id;
  } catch (error) {
    if (uploadedPhoto) {
      await supabaseStorage.storage
        .from(REPAIR_IMAGE_BUCKET)
        .remove([uploadedPhoto.path]);
    }

    throw error;
  }
}

export function subscribeToCustomerRepairs(
  uid: string,
  onRepairs: (repairs: RepairRequest[]) => void,
  onError: (error: Error) => void
) {
  const repairsQuery = query(
    collection(firestore, REPAIRS_COLLECTION),
    where('user_id', '==', uid)
  );

  return onSnapshot(
    repairsQuery,
    (snapshot) => {
      const repairs = snapshot.docs.map((item) => {
        const data = item.data();

        const preferredDate =
          data.preferred_date?.toDate?.() ?? new Date();

        const createdAt =
          data.created_at?.toDate?.() ?? new Date();

        return {
          id: item.id,
          repair_number: String(data.repair_number ?? ''),
          user_id: String(data.user_id ?? ''),
          service_type: String(data.service_type ?? ''),
          jewelry_type: String(data.jewelry_type ?? ''),
          issue_description: String(
            data.issue_description ?? ''
          ),
          damage_photo_url:
            data.damage_photo_url
              ? String(data.damage_photo_url)
              : null,
          damage_photo_path:
            data.damage_photo_path
              ? String(data.damage_photo_path)
              : null,
          preferred_date: preferredDate,
          preferred_time: String(data.preferred_time ?? ''),
          status: (data.status ?? 'pending') as RepairStatus,
          estimated_cost:
            typeof data.estimated_cost === 'number'
              ? data.estimated_cost
              : null,
          deposit: Number(data.deposit ?? 0),
          balance:
            typeof data.balance === 'number'
              ? data.balance
              : null,
          created_at: createdAt,
        };
      });

      repairs.sort(
        (first, second) =>
          second.created_at.getTime() -
          first.created_at.getTime()
      );

      onRepairs(repairs);
    },
    (error) => onError(error)
  );
}