import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import {
  deleteAddress,
  saveAddress,
  setDefaultAddress,
} from '@/services/address-service';
import type { Address, AddressInput } from '@/types/checkout-types';

type Props = {
  visible: boolean;
  uid: string;
  addresses: Address[];
  selectedId: string | null;
  /** Open straight on the "new address" form (used when none are saved yet). */
  startInForm: boolean;
  onSelect: (addressId: string) => void;
  onClose: () => void;
};

const EMPTY_FORM: AddressInput = {
  full_name: '',
  phone: '',
  street: '',
  city: '',
  province: '',
  postal_code: '',
};

const FIELDS: {
  key: keyof AddressInput;
  label: string;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
}[] = [
  { key: 'full_name', label: 'Full name', placeholder: 'Receiver name' },
  {
    key: 'phone',
    label: 'Phone',
    placeholder: 'Example: 09123456789',
    keyboardType: 'phone-pad',
  },
  {
    key: 'street',
    label: 'Street / Barangay',
    placeholder: 'House no., street, barangay',
  },
  { key: 'city', label: 'City', placeholder: 'City or municipality' },
  { key: 'province', label: 'Province', placeholder: 'Province' },
  {
    key: 'postal_code',
    label: 'Postal code',
    placeholder: 'Example: 9200',
    keyboardType: 'number-pad',
  },
];

export default function AddressSheet({
  visible,
  uid,
  addresses,
  selectedId,
  startInForm,
  onSelect,
  onClose,
}: Props) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);
  const [makeDefault, setMakeDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  function openForm(address: Address | null) {
    setEditing(address);
    setForm(
      address
        ? {
            full_name: address.full_name,
            phone: address.phone,
            street: address.street,
            city: address.city,
            province: address.province,
            postal_code: address.postal_code,
          }
        : EMPTY_FORM
    );
    setMakeDefault(address ? address.is_default : addresses.length === 0);
    setMode('form');
  }

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (startInForm || addresses.length === 0) {
      openForm(null);
    } else {
      setMode('list');
    }
    // Only reset when the sheet is opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function handleSave() {
    const clean: AddressInput = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      postal_code: form.postal_code.trim(),
    };

    if (
      !clean.full_name ||
      !clean.phone ||
      !clean.street ||
      !clean.city ||
      !clean.province
    ) {
      Alert.alert(
        'Missing Information',
        'Please fill in name, phone, street, city and province.'
      );
      return;
    }

    if (clean.phone.replace(/\D/g, '').length < 7) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }

    try {
      setSaving(true);
      const id = await saveAddress(uid, clean, {
        id: editing?.id,
        makeDefault,
        hasExisting: addresses.length > 0,
      });

      if (editing) {
        setMode('list');
      } else {
        // A newly added address is selected for this checkout
        onSelect(id);
        onClose();
      }
    } catch (error) {
      Alert.alert(
        'Unable to Save Address',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(address: Address) {
    Alert.alert('Delete Address', 'Remove this saved address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAddress(uid, address.id, address.is_default).catch((error) =>
            Alert.alert('Unable to Delete', error.message)
          );
        },
      },
    ]);
  }

  function handleSetDefault(address: Address) {
    setDefaultAddress(uid, address.id).catch((error) =>
      Alert.alert('Unable to Update', error.message)
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {mode === 'list'
                ? 'Shipping Address'
                : editing
                  ? 'Edit Address'
                  : 'New Address'}
            </Text>

            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {mode === 'list' ? (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              >
                {addresses.map((address) => {
                  const isSelected = address.id === selectedId;

                  return (
                    <TouchableOpacity
                      key={address.id}
                      style={[
                        styles.addressCard,
                        isSelected && styles.addressCardSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        onSelect(address.id);
                        onClose();
                      }}
                    >
                      <View style={styles.addressTop}>
                        <View
                          style={[styles.radio, isSelected && styles.radioActive]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>

                        <Text style={styles.addressName} numberOfLines={1}>
                          {address.full_name}
                        </Text>

                        {address.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.addressLine}>{address.phone}</Text>
                      <Text style={styles.addressLine}>{address.street}</Text>
                      <Text style={styles.addressLine}>
                        {[address.city, address.province, address.postal_code]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>

                      <View style={styles.addressActions}>
                        <TouchableOpacity onPress={() => openForm(address)}>
                          <Text style={styles.linkText}>Edit</Text>
                        </TouchableOpacity>

                        {!address.is_default && (
                          <TouchableOpacity onPress={() => handleSetDefault(address)}>
                            <Text style={styles.linkText}>Set as default</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={() => handleDelete(address)}>
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.8}
                onPress={() => openForm(null)}
              >
                <Text style={styles.primaryButtonText}>+ Add new address</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
              >
                {FIELDS.map((field) => (
                  <View key={field.key} style={styles.formField}>
                    <Text style={styles.formLabel}>{field.label}</Text>

                    <TextInput
                      style={styles.formInput}
                      value={form[field.key]}
                      onChangeText={(text) =>
                        setForm((current) => ({ ...current, [field.key]: text }))
                      }
                      placeholder={field.placeholder}
                      placeholderTextColor="#99958F"
                      keyboardType={field.keyboardType}
                    />
                  </View>
                ))}

                <View style={styles.defaultRow}>
                  <Text style={styles.formLabel}>Set as default address</Text>

                  <Switch
                    value={makeDefault}
                    onValueChange={setMakeDefault}
                    disabled={editing?.is_default === true || addresses.length === 0}
                    trackColor={{ true: '#C58D24' }}
                  />
                </View>
              </ScrollView>

              <View style={styles.formButtons}>
                {addresses.length > 0 && (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.8}
                    onPress={() => setMode('list')}
                    disabled={saving}
                  >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    styles.saveButton,
                    saving && styles.disabled,
                  ]}
                  activeOpacity={0.8}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.primaryButtonText}>
                    {saving ? 'Saving...' : 'Save address'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  backdropTouch: {
    flex: 1,
  },

  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FAF8F2',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sheetTitle: {
    color: '#19191B',
    fontSize: 17,
    fontWeight: 'bold',
  },

  closeText: {
    color: '#19191B',
    fontSize: 28,
    lineHeight: 28,
  },

  listContent: {
    gap: 10,
    paddingBottom: 14,
  },

  addressCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    padding: 14,
  },

  addressCardSelected: {
    borderColor: '#C58D24',
  },

  addressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#19191B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioActive: {
    borderColor: '#C58D24',
  },

  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C58D24',
  },

  addressName: {
    flex: 1,
    color: '#19191B',
    fontSize: 12,
    fontWeight: 'bold',
  },

  defaultBadge: {
    backgroundColor: '#F3E6C8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  defaultBadgeText: {
    color: '#8A5F0E',
    fontSize: 9,
    fontWeight: '600',
  },

  addressLine: {
    color: '#4A4742',
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 24,
  },

  addressActions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 10,
    marginLeft: 24,
  },

  linkText: {
    color: '#B77C14',
    fontSize: 11,
    fontWeight: '600',
  },

  deleteText: {
    color: '#B74242',
    fontSize: 11,
    fontWeight: '600',
  },

  formContent: {
    gap: 12,
    paddingBottom: 16,
  },

  formField: {
    gap: 5,
  },

  formLabel: {
    color: '#6E6A65',
    fontSize: 10,
  },

  formInput: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 14,
    paddingHorizontal: 14,
    color: '#19191B',
    fontSize: 12,
  },

  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  primaryButton: {
    height: 46,
    backgroundColor: '#050505',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButton: {
    flex: 1,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  secondaryButton: {
    height: 46,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C58D24',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#19191B',
    fontSize: 12,
    fontWeight: 'bold',
  },

  disabled: {
    opacity: 0.6,
  },
});