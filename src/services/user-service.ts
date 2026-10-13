import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { auth, firestore } from '../../firebaseConfig';
import { supabaseStorage } from '../lib/supabase-storage';
import type { UserProfile } from '@/types/user';

const PROFILE_IMAGE_BUCKET = 'profile-images';

type ProfileChanges = {
  full_name: string;
  mobile_number: string;
  address: string;
  city_province: string;
};

async function getImageBytes(
  image: ImagePickerAsset
) {
  if (Platform.OS === 'web') {
    const response = await fetch(image.uri);
    return response.arrayBuffer();
  }

  return new File(image.uri).arrayBuffer();
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('You are not logged in.');
  }

  const snapshot = await getDoc(
    doc(firestore, 'profiles', user.uid)
  );

  if (!snapshot.exists()) {
    throw new Error('Profile not found.');
  }

  const data = snapshot.data();

  return {
    full_name: String(data.full_name ?? ''),
    email: String(
      data.email ?? user.email ?? ''
    ),
    mobile_number: String(
      data.mobile_number ?? ''
    ),
    address: String(data.address ?? ''),
    city_province: String(
      data.city_province ?? ''
    ),
    profile_photo_url:
      typeof data.profile_photo_url === 'string'
        ? data.profile_photo_url
        : '',
    profile_photo_path:
      typeof data.profile_photo_path === 'string'
        ? data.profile_photo_path
        : '',
  };
}

export async function updateCurrentUserProfile(
  changes: ProfileChanges
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('You are not logged in.');
  }

  await setDoc(
    doc(firestore, 'profiles', user.uid),
    {
      ...changes,
      updated_at: serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}

export async function updateCurrentProfilePhoto(
  image: ImagePickerAsset
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('You are not logged in.');
  }

  const extensionFromName = image.fileName
    ?.split('.')
    .pop()
    ?.toLowerCase();

  const extension =
    extensionFromName &&
    ['jpg', 'jpeg', 'png', 'webp'].includes(
      extensionFromName
    )
      ? extensionFromName
      : 'jpg';

  const contentType =
    image.mimeType ??
    (extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg');

  const path =
    `profiles/${user.uid}/` +
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

  const imageBytes = await getImageBytes(image);

  const { error } = await supabaseStorage.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(path, imageBytes, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Profile photo upload failed: ${error.message}`
    );
  }

  const { data } = supabaseStorage.storage
    .from(PROFILE_IMAGE_BUCKET)
    .getPublicUrl(path);

  const photoUrl = data.publicUrl;

  try {
    await setDoc(
      doc(firestore, 'profiles', user.uid),
      {
        profile_photo_url: photoUrl,
        profile_photo_path: path,
        updated_at: serverTimestamp(),
      },
      {
        merge: true,
      }
    );
  } catch (error) {
    await supabaseStorage.storage
      .from(PROFILE_IMAGE_BUCKET)
      .remove([path]);

    throw error;
  }

  return {
    profile_photo_url: photoUrl,
    profile_photo_path: path,
  };
}