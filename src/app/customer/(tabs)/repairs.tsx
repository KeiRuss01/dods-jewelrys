import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

import { useUid } from '@/hooks/use-uid';
import {
  createRepairRequest,
  subscribeToCustomerRepairs,
} from '@/services/repair-service';
import type { RepairRequest } from '@/services/repair-service';

type ScreenMode = 'book' | 'view';

const SERVICE_TYPES = [
  {
    value: 'cleaning',
    label: 'Cleaning',
    icon: '✦',
  },
  {
    value: 'resizing',
    label: 'Resizing',
    icon: '↗',
  },
  {
    value: 'stone_setting',
    label: 'Stone Setting',
    icon: '◇',
  },
  {
    value: 'other',
    label: 'Others',
    icon: '+',
  },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDate(date: Date) {
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPeso(value: number | null) {
  if (value === null) {
    return 'Not yet provided';
  }

  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatServiceType(serviceType: string) {
  const service = SERVICE_TYPES.find(
    (item) => item.value === serviceType
  );

  return service?.label ?? serviceType;
}

export default function RepairsScreen() {
  const { uid, ready } = useUid();

  const [mode, setMode] = useState<ScreenMode>('book');
  const [serviceType, setServiceType] = useState('');
  const [jewelryType, setJewelryType] = useState('');
  const [description, setDescription] = useState('');

  const params = useLocalSearchParams<{
    mode?: string | string[];
  }>();

  const requestedMode = Array.isArray(params.mode)
    ? params.mode[0]
    : params.mode;

  useEffect(() => {
    if (requestedMode === 'view') {
      setMode('view');
    }

    if (requestedMode === 'book') {
      setMode('book');
    }
  }, [requestedMode]);

  const [photo, setPhoto] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [preferredDate, setPreferredDate] = useState(
    new Date()
  );

  const [preferredTime, setPreferredTime] = useState(
    new Date()
  );

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [showTimePicker, setShowTimePicker] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [repairs, setRepairs] = useState<
    RepairRequest[]
  >([]);

  const [loadingRepairs, setLoadingRepairs] =
    useState(true);

  useEffect(() => {
    if (!uid) {
      setRepairs([]);
      setLoadingRepairs(false);
      return;
    }

    setLoadingRepairs(true);

    return subscribeToCustomerRepairs(
      uid,
      (nextRepairs) => {
        setRepairs(nextRepairs);
        setLoadingRepairs(false);
      },
      (error) => {
        setLoadingRepairs(false);

        Alert.alert(
          'Unable to Load Repairs',
          error.message
        );
      }
    );
  }, [uid]);

  function handleNotifications() {
    Alert.alert(
      'Notifications',
      'Notifications will be added later.'
    );
  }

  function handleCart() {
    router.push('/customer/cart');
  }

  async function choosePhoto() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photos.'
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  }

  function resetForm() {
    setServiceType('');
    setJewelryType('');
    setDescription('');
    setPhoto(null);
    setPreferredDate(new Date());
    setPreferredTime(new Date());
  }

  async function handleBookRepair() {
    if (!uid) {
      Alert.alert(
        'Login Required',
        'Please log in before booking a repair.'
      );
      return;
    }

    if (!serviceType) {
      Alert.alert(
        'Missing Information',
        'Please select a service type.'
      );
      return;
    }

    if (!jewelryType.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter the jewelry type.'
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        'Missing Information',
        'Please describe the jewelry problem.'
      );
      return;
    }

    try {
      setSubmitting(true);

      await createRepairRequest(
        {
          uid,
          serviceType,
          jewelryType: jewelryType.trim(),
          issueDescription: description.trim(),
          preferredDate,
          preferredTime: formatTime(preferredTime),
        },
        photo
      );

      resetForm();

      Alert.alert(
        'Repair Booked',
        'Your repair request was submitted successfully.',
        [
          {
            text: 'View Repair',
            onPress: () => setMode('view'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Unable to Book Repair',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function showRepairDetails(repair: RepairRequest) {
    Alert.alert(
      repair.repair_number,
      [
        `Service: ${formatServiceType(
          repair.service_type
        )}`,
        `Jewelry: ${repair.jewelry_type}`,
        `Issue: ${repair.issue_description}`,
        `Status: ${
          STATUS_LABELS[repair.status] ??
          repair.status
        }`,
        `Preferred date: ${formatDate(
          repair.preferred_date
        )}`,
        `Preferred time: ${repair.preferred_time}`,
        `Estimated cost: ${formatPeso(
          repair.estimated_cost
        )}`,
        `Deposit: ${formatPeso(repair.deposit)}`,
        `Balance: ${formatPeso(repair.balance)}`,
      ].join('\n')
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#B77C14"
        />
      </SafeAreaView>
    );
  }

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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Repair
            </Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleNotifications}
                activeOpacity={0.7}
              >
                <Image
                  source={require(
                    '../../../../assets/icons/notification.png'
                  )}
                  style={styles.headerIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleCart}
                activeOpacity={0.7}
              >
                <Image
                  source={require(
                    '../../../../assets/icons/cart.png'
                  )}
                  style={styles.headerIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.title}>
            {mode === 'book'
              ? 'Book Repair'
              : 'View Repair'}
          </Text>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'book' &&
                  styles.activeModeButton,
              ]}
              onPress={() => setMode('book')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === 'book' &&
                    styles.activeModeText,
                ]}
              >
                Book Repair
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'view' &&
                  styles.activeModeButton,
              ]}
              onPress={() => setMode('view')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === 'view' &&
                    styles.activeModeText,
                ]}
              >
                View Repair
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'book' ? (
            <View style={styles.form}>
              <Text style={styles.label}>
                1. Service Type
              </Text>

              <View style={styles.serviceRow}>
                {SERVICE_TYPES.map((service) => {
                  const selected =
                    serviceType === service.value;

                  return (
                    <TouchableOpacity
                      key={service.value}
                      style={[
                        styles.serviceCard,
                        selected &&
                          styles.selectedService,
                      ]}
                      onPress={() =>
                        setServiceType(service.value)
                      }
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.serviceIcon,
                          selected &&
                            styles.selectedServiceIcon,
                        ]}
                      >
                        {service.icon}
                      </Text>

                      <Text
                        style={[
                          styles.serviceText,
                          selected &&
                            styles.selectedServiceText,
                        ]}
                        numberOfLines={1}
                      >
                        {service.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>
                2. Jewelry Type
              </Text>

              <TextInput
                style={styles.input}
                value={jewelryType}
                onChangeText={setJewelryType}
                placeholder="Example: Ring, necklace, bracelet"
                placeholderTextColor="#99958F"
              />

              <Text style={styles.label}>
                3. Describe the Issue
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.descriptionInput,
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the damage or requested service"
                placeholderTextColor="#99958F"
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.label}>
                4. Upload Damage Photo
              </Text>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={choosePhoto}
                activeOpacity={0.8}
              >
                {photo ? (
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photoPreview}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlus}>
                      +
                    </Text>

                    <Text style={styles.photoText}>
                      Select damage photo
                    </Text>

                    <Text style={styles.photoHint}>
                      JPG, PNG or WEBP
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {photo && (
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setPhoto(null)}
                >
                  <Text style={styles.removePhoto}>
                    Remove selected photo
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.scheduleRow}>
                <View style={styles.scheduleColumn}>
                  <Text style={styles.label}>
                    5. Preferred Date
                  </Text>

                  <TouchableOpacity
                    style={styles.scheduleInput}
                    onPress={() =>
                      setShowDatePicker(true)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.inputText}>
                      {formatDate(preferredDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.scheduleColumn}>
                  <Text style={styles.label}>
                    6. Preferred Time
                  </Text>

                  <TouchableOpacity
                    style={styles.scheduleInput}
                    onPress={() =>
                      setShowTimePicker(true)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.inputText}>
                      {formatTime(preferredTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={preferredDate}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(false);

                    if (selectedDate) {
                      setPreferredDate(selectedDate);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={preferredTime}
                  mode="time"
                  onChange={(_, selectedTime) => {
                    setShowTimePicker(false);

                    if (selectedTime) {
                      setPreferredTime(selectedTime);
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting &&
                    styles.disabledButton,
                ]}
                onPress={handleBookRepair}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.submitText}>
                    Book Repair
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : loadingRepairs ? (
            <View style={styles.centerBox}>
              <ActivityIndicator
                size="large"
                color="#B77C14"
              />

              <Text style={styles.centerText}>
                Loading repairs...
              </Text>
            </View>
          ) : repairs.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Image
                  source={require(
                    '../../../../assets/icons/repair.png'
                  )}
                  style={styles.emptyIconImage}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No repair requests
              </Text>

              <Text style={styles.centerText}>
                Your submitted repair requests will
                appear here.
              </Text>

              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setMode('book')}
                activeOpacity={0.8}
              >
                <Text style={styles.submitText}>
                  Book Your First Repair
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.repairList}>
              {repairs.map((repair) => (
                <View
                  key={repair.id}
                  style={styles.repairCard}
                >
                  <View style={styles.repairHeader}>
                    <View style={styles.repairHeading}>
                      <Text style={styles.repairNumber}>
                        {repair.repair_number}
                      </Text>

                      <Text style={styles.jewelryName}>
                        {repair.jewelry_type}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        repair.status ===
                          'completed' &&
                          styles.completedBadge,
                        repair.status ===
                          'cancelled' &&
                          styles.cancelledBadge,
                        repair.status ===
                          'in_progress' &&
                          styles.progressBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          repair.status ===
                            'completed' &&
                            styles.completedStatus,
                          repair.status ===
                            'cancelled' &&
                            styles.cancelledStatus,
                          repair.status ===
                            'in_progress' &&
                            styles.progressStatus,
                        ]}
                      >
                        {STATUS_LABELS[
                          repair.status
                        ] ?? repair.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Service
                    </Text>

                    <Text style={styles.detailValue}>
                      {formatServiceType(
                        repair.service_type
                      )}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Created
                    </Text>

                    <Text style={styles.detailValue}>
                      {formatDate(repair.created_at)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Preferred
                    </Text>

                    <Text style={styles.detailValue}>
                      {formatDate(
                        repair.preferred_date
                      )}{' '}
                      at {repair.preferred_time}
                    </Text>
                  </View>

                  {repair.estimated_cost !== null && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        Estimated
                      </Text>

                      <Text style={styles.detailValue}>
                        {formatPeso(
                          repair.estimated_cost
                        )}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.balanceLabel}>
                        Remaining Balance
                      </Text>

                      <Text style={styles.balanceValue}>
                        {formatPeso(repair.balance)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() =>
                        showRepairDetails(repair)
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.detailsLink}>
                        View Details →
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => setMode('book')}
                activeOpacity={0.8}
              >
                <Text style={styles.submitText}>
                  Book New Repair
                </Text>
              </TouchableOpacity>
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

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#19191B',
    fontSize: 16,
    fontWeight: 'bold',
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  headerButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIcon: {
    width: 22,
    height: 22,
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
    gap: 12,
    marginTop: 18,
    marginBottom: 20,
  },

  modeButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#DED8CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeModeButton: {
    backgroundColor: '#050505',
    borderColor: '#050505',
  },

  modeText: {
    color: '#19191B',
    fontSize: 12,
    fontWeight: 'bold',
  },

  activeModeText: {
    color: '#FFFFFF',
  },

  form: {
    borderTopWidth: 1,
    borderTopColor: '#E4DED2',
    paddingTop: 13,
  },

  label: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 7,
  },

  serviceRow: {
    flexDirection: 'row',
    gap: 8,
  },

  serviceCard: {
    flex: 1,
    height: 68,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  selectedService: {
    borderColor: '#C58D24',
    backgroundColor: '#FFF7E8',
  },

  serviceIcon: {
    color: '#19191B',
    fontSize: 22,
    fontWeight: '500',
  },

  selectedServiceIcon: {
    color: '#A8751F',
  },

  serviceText: {
    color: '#19191B',
    fontSize: 8,
    marginTop: 4,
    textAlign: 'center',
  },

  selectedServiceText: {
    color: '#A8751F',
    fontWeight: 'bold',
  },

  input: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    color: '#19191B',
    fontSize: 11,
  },

  inputText: {
    color: '#19191B',
    fontSize: 10,
  },

  descriptionInput: {
    height: 92,
    paddingTop: 13,
    paddingBottom: 13,
  },

  photoButton: {
    minHeight: 86,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoPreview: {
    width: '100%',
    height: 145,
    resizeMode: 'cover',
  },

  photoPlus: {
    color: '#B77C14',
    fontSize: 20,
    lineHeight: 21,
  },

  photoText: {
    color: '#B77C14',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },

  photoHint: {
    color: '#99958F',
    fontSize: 8,
    marginTop: 3,
  },

  removePhotoButton: {
    alignSelf: 'flex-end',
    marginTop: 7,
  },

  removePhoto: {
    color: '#B74242',
    fontSize: 9,
    fontWeight: '600',
  },

  scheduleRow: {
    flexDirection: 'row',
    gap: 10,
  },

  scheduleColumn: {
    flex: 1,
  },

  scheduleInput: {
    height: 47,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  submitButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.55,
  },

  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 65,
  },

  centerText: {
    color: '#77736D',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 8,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 34,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAF8F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyIconImage: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
    tintColor: '#A8751F',
  },

  emptyTitle: {
    color: '#19191B',
    fontSize: 16,
    fontWeight: 'bold',
  },

  emptyButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  repairList: {
    gap: 13,
  },

  repairCard: {
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },

  repairHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  repairHeading: {
    flex: 1,
  },

  repairNumber: {
    color: '#77736D',
    fontSize: 9,
    fontWeight: '600',
  },

  jewelryName: {
    color: '#19191B',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 3,
  },

  statusBadge: {
    borderRadius: 11,
    backgroundColor: '#FFF4DE',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  completedBadge: {
    backgroundColor: '#E9F7EC',
  },

  cancelledBadge: {
    backgroundColor: '#FCEBEC',
  },

  progressBadge: {
    backgroundColor: '#FFF4DE',
  },

  statusText: {
    color: '#B77C14',
    fontSize: 8,
    fontWeight: 'bold',
  },

  completedStatus: {
    color: '#238636',
  },

  cancelledStatus: {
    color: '#B74242',
  },

  progressStatus: {
    color: '#B77C14',
  },

  detailDivider: {
    height: 1,
    backgroundColor: '#EEE9E0',
    marginVertical: 11,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 7,
  },

  detailLabel: {
    color: '#77736D',
    fontSize: 9,
  },

  detailValue: {
    flex: 1,
    color: '#19191B',
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'right',
  },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEE9E0',
    marginTop: 6,
    paddingTop: 11,
  },

  balanceLabel: {
    color: '#77736D',
    fontSize: 8,
  },

  balanceValue: {
    color: '#19191B',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },

  detailsButton: {
    minHeight: 31,
    borderRadius: 16,
    backgroundColor: '#FAF8F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
  },

  detailsLink: {
    color: '#19191B',
    fontSize: 9,
    fontWeight: 'bold',
  },
});