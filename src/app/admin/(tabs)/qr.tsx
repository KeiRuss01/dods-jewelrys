import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import type {
  BarcodeScanningResult,
} from 'expo-camera';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminHeader } from '@/components/admin-header';
import {
  ClaimRecord,
  findRepairByClaimCode,
  markRepairClaimed,
} from '@/services/claim-service';

type ScannerMode = 'scan' | 'code';

const STATUS_LABELS: Record<
  string,
  string
> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  ready_for_release:
    'Ready for Release',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
};

function formatServiceType(
  serviceType: string
) {
  return serviceType
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ');
}

export default function AdminQrScreen() {
  const [
    permission,
    requestPermission,
  ] = useCameraPermissions();

  const [mode, setMode] =
    useState<ScannerMode>('scan');

  const [claimCode, setClaimCode] =
    useState('');

  const [claim, setClaim] =
    useState<ClaimRecord | null>(null);

  const [searching, setSearching] =
    useState(false);

  const [claiming, setClaiming] =
    useState(false);

  const [scanned, setScanned] =
    useState(false);

  async function searchClaim(
    value?: string
  ) {
    const codeToSearch =
      value ?? claimCode;

    if (!codeToSearch.trim()) {
      Alert.alert(
        'Claim Code Required',
        'Enter or scan a claim code.'
      );
      return;
    }

    try {
      setSearching(true);
      setClaim(null);

      const result =
        await findRepairByClaimCode(
          codeToSearch
        );

      setClaimCode(result.claim_code);
      setClaim(result);
    } catch (error) {
      Alert.alert(
        'Claim Not Found',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );

      setScanned(false);
    } finally {
      setSearching(false);
    }
  }

  function handleBarcodeScanned(
    result: BarcodeScanningResult
  ) {
    if (scanned || searching) {
      return;
    }

    setScanned(true);
    setClaimCode(result.data);
    void searchClaim(result.data);
  }

  async function handleScanMode() {
    setMode('scan');
    setClaim(null);
    setClaimCode('');
    setScanned(false);

    if (
      permission &&
      !permission.granted
    ) {
      await requestPermission();
    }
  }

  function handleCodeMode() {
    setMode('code');
    setClaim(null);
    setClaimCode('');
    setScanned(false);
  }

  function handleCancel() {
    setClaim(null);
    setClaimCode('');
    setScanned(false);
  }

  function handleMarkClaimed() {
    if (!claim || claiming) {
      return;
    }

    if (
      claim.status === 'claimed'
    ) {
      Alert.alert(
        'Already Claimed',
        'This jewelry was already released.'
      );
      return;
    }

    if (
      claim.status !==
      'ready_for_release'
    ) {
      Alert.alert(
        'Not Ready for Release',
        'This repair must be marked Ready for Release before it can be claimed.'
      );
      return;
    }

    Alert.alert(
      'Release Jewelry',
      `Release ${claim.jewelry_type} to ${claim.customer_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark as Claimed',
          onPress: async () => {
            try {
              setClaiming(true);

              await markRepairClaimed(
                claim.repair_id
              );

              setClaim((current) =>
                current
                  ? {
                      ...current,
                      status: 'claimed',
                      claimed_at:
                        new Date(),
                    }
                  : null
              );

              Alert.alert(
                'Claim Successful',
                'The jewelry has been marked as claimed.'
              );
            } catch (error) {
              Alert.alert(
                'Unable to Complete Claim',
                error instanceof Error
                  ? error.message
                  : 'Please try again.'
              );
            } finally {
              setClaiming(false);
            }
          },
        },
      ]
    );
  }

  const canMarkClaimed =
    claim?.status ===
      'ready_for_release' &&
    !claiming;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <AdminHeader />

          <Text style={styles.title}>
            QR Claim Scanner
          </Text>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'scan' &&
                  styles.activeModeButton,
              ]}
              onPress={handleScanMode}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeIcon,
                  mode === 'scan' &&
                    styles.activeModeText,
                ]}
              >
                ▦
              </Text>

              <Text
                style={[
                  styles.modeText,
                  mode === 'scan' &&
                    styles.activeModeText,
                ]}
              >
                Scan QR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'code' &&
                  styles.activeModeButton,
              ]}
              onPress={handleCodeMode}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeIcon,
                  mode === 'code' &&
                    styles.activeModeText,
                ]}
              >
                ⌨
              </Text>

              <Text
                style={[
                  styles.modeText,
                  mode === 'code' &&
                    styles.activeModeText,
                ]}
              >
                Enter Code
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'scan' ? (
            <View
              style={
                styles.scannerSection
              }
            >
              <Text
                style={
                  styles.scannerTitle
                }
              >
                QR Scanner
              </Text>

              {!permission ? (
                <View
                  style={
                    styles.permissionBox
                  }
                >
                  <ActivityIndicator
                    color="#B77C14"
                  />

                  <Text
                    style={
                      styles.permissionText
                    }
                  >
                    Checking camera
                    permission...
                  </Text>
                </View>
              ) : !permission.granted ? (
                <View
                  style={
                    styles.permissionBox
                  }
                >
                  <Text
                    style={
                      styles.permissionTitle
                    }
                  >
                    Camera permission is
                    required
                  </Text>

                  <Text
                    style={
                      styles.permissionText
                    }
                  >
                    Allow camera access to
                    scan claim QR codes.
                  </Text>

                  <TouchableOpacity
                    style={
                      styles.permissionButton
                    }
                    onPress={
                      requestPermission
                    }
                  >
                    <Text
                      style={
                        styles.permissionButtonText
                      }
                    >
                      Allow Camera
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View
                  style={styles.cameraBox}
                >
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={
                      scanned
                        ? undefined
                        : handleBarcodeScanned
                    }
                  />

                  <View
                    pointerEvents="none"
                    style={
                      styles.scannerOverlay
                    }
                  >
                    <View
                      style={[
                        styles.corner,
                        styles.topLeft,
                      ]}
                    />

                    <View
                      style={[
                        styles.corner,
                        styles.topRight,
                      ]}
                    />

                    <View
                      style={[
                        styles.corner,
                        styles.bottomLeft,
                      ]}
                    />

                    <View
                      style={[
                        styles.corner,
                        styles.bottomRight,
                      ]}
                    />

                    <View
                      style={styles.scanLine}
                    />
                  </View>

                  {searching && (
                    <View
                      style={
                        styles.searchingOverlay
                      }
                    >
                      <ActivityIndicator
                        size="large"
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.searchingText
                        }
                      >
                        Checking claim...
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {scanned &&
                !searching &&
                !claim && (
                  <TouchableOpacity
                    style={
                      styles.scanAgainButton
                    }
                    onPress={() =>
                      setScanned(false)
                    }
                  >
                    <Text
                      style={
                        styles.scanAgainText
                      }
                    >
                      Scan Again
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          ) : (
            <View
              style={styles.codeSection}
            >
              <Text style={styles.inputLabel}>
                Claim Code
              </Text>

              <View
                style={styles.searchRow}
              >
                <TextInput
                  style={styles.codeInput}
                  value={claimCode}
                  onChangeText={(value) => {
                    setClaimCode(
                      value.toUpperCase()
                    );

                    setClaim(null);
                  }}
                  placeholder="CLM-2026-001"
                  placeholderTextColor="#99958F"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!searching}
                  returnKeyType="search"
                  onSubmitEditing={() =>
                    searchClaim()
                  }
                />

                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    searching &&
                      styles.disabledButton,
                  ]}
                  onPress={() =>
                    searchClaim()
                  }
                  disabled={searching}
                >
                  {searching ? (
                    <ActivityIndicator
                      size="small"
                      color="#19191B"
                    />
                  ) : (
                    <Text
                      style={
                        styles.searchButtonText
                      }
                    >
                      ⌕ Search
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {claim && (
            <View
              style={styles.resultSection}
            >
              <Text style={styles.resultLabel}>
                Results for{' '}
                {claim.claim_code}
              </Text>

              <View style={styles.resultCard}>
                <View
                  style={styles.resultRow}
                >
                  <Text
                    style={
                      styles.resultName
                    }
                  >
                    Customer
                  </Text>

                  <Text
                    style={
                      styles.resultValue
                    }
                  >
                    {claim.customer_name}
                  </Text>
                </View>

                <View
                  style={styles.resultDivider}
                />

                <View
                  style={styles.resultRow}
                >
                  <Text
                    style={
                      styles.resultName
                    }
                  >
                    Claim Code
                  </Text>

                  <Text
                    style={
                      styles.resultValue
                    }
                  >
                    {claim.claim_code}
                  </Text>
                </View>

                <View
                  style={styles.resultDivider}
                />

                <View
                  style={styles.resultRow}
                >
                  <Text
                    style={
                      styles.resultName
                    }
                  >
                    Repair ID
                  </Text>

                  <Text
                    style={
                      styles.resultValue
                    }
                  >
                    {claim.repair_number}
                  </Text>
                </View>

                <View
                  style={styles.resultDivider}
                />

                <View
                  style={styles.resultRow}
                >
                  <Text
                    style={
                      styles.resultName
                    }
                  >
                    Item
                  </Text>

                  <Text
                    style={
                      styles.resultValue
                    }
                  >
                    {claim.jewelry_type}
                  </Text>
                </View>

                <View
                  style={styles.resultDivider}
                />

                <View
                  style={styles.resultRow}
                >
                  <Text
                    style={
                      styles.resultName
                    }
                  >
                    Service
                  </Text>

                  <Text
                    style={
                      styles.resultValue
                    }
                  >
                    {formatServiceType(
                      claim.service_type
                    )}
                  </Text>
                </View>

                <View
                  style={styles.resultDivider}
                />

                <View
                  style={styles.resultRow}
                >
                  <Text
                    style={
                      styles.resultName
                    }
                  >
                    Status
                  </Text>

                  <Text
                    style={[
                      styles.resultValue,
                      styles.statusValue,
                      claim.status ===
                        'claimed' &&
                        styles.claimedStatus,
                    ]}
                  >
                    {STATUS_LABELS[
                      claim.status
                    ] ?? claim.status}
                  </Text>
                </View>
              </View>

              <View
                style={styles.resultActions}
              >
                <TouchableOpacity
                  style={[
                    styles.claimButton,
                    !canMarkClaimed &&
                      styles.disabledClaimButton,
                  ]}
                  onPress={
                    handleMarkClaimed
                  }
                  disabled={
                    !canMarkClaimed
                  }
                >
                  {claiming ? (
                    <ActivityIndicator
                      size="small"
                      color="#19191B"
                    />
                  ) : (
                    <Text
                      style={
                        styles.claimButtonText
                      }
                    >
                      {claim.status ===
                      'claimed'
                        ? 'Already Claimed'
                        : 'Mark as Claimed'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              {claim.status !==
                'ready_for_release' &&
                claim.status !==
                  'claimed' && (
                  <Text
                    style={styles.statusHelp}
                  >
                    This repair must be marked
                    Ready for Release before it
                    can be claimed.
                  </Text>
                )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 100,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  adminText: {
    color: '#19191B',
    fontSize: 15,
    fontWeight: 'bold',
  },

  headerActions: {
    flexDirection: 'row',
    gap: 5,
    marginLeft: 5,
  },

  headerButton: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#19191B',
  },

  title: {
    color: '#19191B',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 18,
  },

  modeRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 23,
  },

  modeButton: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  activeModeButton: {
    borderColor: '#C58D24',
  },

  modeIcon: {
    color: '#19191B',
    fontSize: 15,
  },

  modeText: {
    color: '#19191B',
    fontSize: 11,
  },

  activeModeText: {
    fontWeight: '600',
  },

  scannerSection: {
    alignItems: 'center',
    marginTop: 45,
  },

  scannerTitle: {
    color: '#19191B',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 18,
  },

  cameraBox: {
    width: '82%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#19191B',
  },

  camera: {
    flex: 1,
  },

  scannerOverlay: {
    ...StyleSheet.absoluteFill,
  },

  corner: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderColor: '#FFFFFF',
  },

  topLeft: {
    top: 25,
    left: 25,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },

  topRight: {
    top: 25,
    right: 25,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },

  bottomLeft: {
    bottom: 25,
    left: 25,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },

  bottomRight: {
    right: 25,
    bottom: 25,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },

  scanLine: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '50%',
    height: 2,
    backgroundColor: '#C58D24',
  },

  permissionBox: {
    width: '82%',
    minHeight: 230,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  permissionTitle: {
    color: '#19191B',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  permissionText: {
    color: '#77736D',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 7,
  },

  permissionButton: {
    height: 39,
    borderRadius: 20,
    backgroundColor: '#19191B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 17,
  },

  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  searchingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor:
      'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
  },

  scanAgainButton: {
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#C58D24',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
  },

  scanAgainText: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: 'bold',
  },

  codeSection: {
    marginTop: 35,
  },

  inputLabel: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 7,
  },

  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },

  codeInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    color: '#19191B',
    fontSize: 11,
    paddingHorizontal: 13,
  },

  searchButton: {
    minWidth: 85,
    height: 45,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },

  searchButtonText: {
    color: '#19191B',
    fontSize: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  resultSection: {
    marginTop: 28,
  },

  resultLabel: {
    color: '#77736D',
    fontSize: 10,
    marginBottom: 9,
  },

  resultCard: {
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  resultRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },

  resultName: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: '600',
  },

  resultValue: {
    flex: 1,
    color: '#19191B',
    fontSize: 10,
    textAlign: 'right',
  },

  statusValue: {
    color: '#A8751F',
    fontWeight: 'bold',
  },

  claimedStatus: {
    color: '#238636',
  },

  resultDivider: {
    height: 1,
    backgroundColor: '#E4B85E',
  },

  resultActions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 22,
  },

  claimButton: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#C58D24',
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledClaimButton: {
    opacity: 0.45,
  },

  claimButtonText: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: 'bold',
  },

  cancelButton: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  statusHelp: {
    color: '#B74242',
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
