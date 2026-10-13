import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import {
  auth,
  firestore,
} from '../../firebaseConfig';

export type ClaimRecord = {
  repair_id: string;
  repair_number: string;
  claim_code: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  jewelry_type: string;
  service_type: string;
  status: string;
  claimed_at: Date | null;
};

export function extractClaimCode(
  rawValue: string
) {
  const value = rawValue.trim();

  if (!value) {
    return '';
  }

  try {
    const parsed = JSON.parse(value) as {
      claim_code?: unknown;
      claimCode?: unknown;
      code?: unknown;
    };

    const jsonCode =
      parsed.claim_code ??
      parsed.claimCode ??
      parsed.code;

    if (
      typeof jsonCode === 'string' &&
      jsonCode.trim()
    ) {
      return jsonCode
        .trim()
        .toUpperCase();
    }
  } catch {
    // The QR may simply contain the claim code.
  }

  const codeMatch = value
    .toUpperCase()
    .match(/CLM-\d{4}-[A-Z0-9]+/);

  if (codeMatch) {
    return codeMatch[0];
  }

  return value.toUpperCase();
}

function convertDate(value: unknown) {
  if (
    value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === 'function'
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    ).toDate();
  }

  return null;
}

export async function findRepairByClaimCode(
  rawCode: string
): Promise<ClaimRecord> {
  const claimCode =
    extractClaimCode(rawCode);

  if (!claimCode) {
    throw new Error(
      'Please enter or scan a claim code.'
    );
  }

  const claimQuery = query(
    collection(firestore, 'repairs'),
    where('claim_code', '==', claimCode),
    limit(1)
  );

  const result = await getDocs(claimQuery);

  if (result.empty) {
    throw new Error(
      'No repair was found using this claim code.'
    );
  }

  const repairDocument = result.docs[0];
  const repairData =
    repairDocument.data();

  const userId = String(
    repairData.user_id ?? ''
  );

  let customerName = 'Unknown Customer';
  let customerEmail = '';

  if (userId) {
    const profileDocument = await getDoc(
      doc(firestore, 'profiles', userId)
    );

    if (profileDocument.exists()) {
      const profileData =
        profileDocument.data();

      customerName = String(
        profileData.full_name ??
          'Unknown Customer'
      );

      customerEmail = String(
        profileData.email ?? ''
      );
    }
  }

  return {
    repair_id: repairDocument.id,
    repair_number: String(
      repairData.repair_number ?? ''
    ),
    claim_code: String(
      repairData.claim_code ?? claimCode
    ),
    user_id: userId,
    customer_name: customerName,
    customer_email: customerEmail,
    jewelry_type: String(
      repairData.jewelry_type ?? ''
    ),
    service_type: String(
      repairData.service_type ?? ''
    ),
    status: String(
      repairData.status ?? 'pending'
    ),
    claimed_at: convertDate(
      repairData.claimed_at
    ),
  };
}

export async function markRepairClaimed(
  repairId: string
) {
  const admin = auth.currentUser;

  if (!admin) {
    throw new Error(
      'You are not logged in as an administrator.'
    );
  }

  const repairReference = doc(
    firestore,
    'repairs',
    repairId
  );

  await runTransaction(
    firestore,
    async (transaction) => {
      const repairDocument =
        await transaction.get(
          repairReference
        );

      if (!repairDocument.exists()) {
        throw new Error(
          'This repair no longer exists.'
        );
      }

      const repairData =
        repairDocument.data();

      const status = String(
        repairData.status ?? ''
      );

      if (status === 'claimed') {
        throw new Error(
          'This jewelry has already been claimed.'
        );
      }

      if (status !== 'ready_for_release') {
        throw new Error(
          'This repair is not ready for release.'
        );
      }

      if (!repairData.claim_code) {
        throw new Error(
          'This repair does not have a claim code.'
        );
      }

      transaction.update(
        repairReference,
        {
          status: 'claimed',
          claimed_at: serverTimestamp(),
          claimed_by: admin.uid,
          updated_at: serverTimestamp(),
        }
      );
    }
  );
}

function generateClaimCode() {
  const year = new Date().getFullYear();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

  return `CLM-${year}-${randomPart}`;
}

/**
 * Call this from the future Admin Repairs screen
 * when the repair is finished and ready to release.
 */
export async function prepareRepairForRelease(
  repairId: string
) {
  const admin = auth.currentUser;

  if (!admin) {
    throw new Error(
      'You are not logged in as an administrator.'
    );
  }

  const repairReference = doc(
    firestore,
    'repairs',
    repairId
  );

  const repairDocument = await getDoc(
    repairReference
  );

  if (!repairDocument.exists()) {
    throw new Error(
      'Repair record not found.'
    );
  }

  const repairData = repairDocument.data();

  const existingClaimCode =
    typeof repairData.claim_code === 'string'
      ? repairData.claim_code
      : '';

  const claimCode =
    existingClaimCode ||
    generateClaimCode();

  await updateDoc(repairReference, {
    claim_code: claimCode,
    status: 'ready_for_release',
    ready_for_release_at:
      serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return claimCode;
}