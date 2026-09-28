import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

export default function Dropdown({
  label,
  options = [],
  selectedValue,
  onValueChange,
  placeholder = 'Sélectionner une option',
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const handleSelect = (value) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectorText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown color={COLORS.textSecondary} size={20} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Sélection'}</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X color={COLORS.text} size={24} />
              </Pressable>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item, index) => item.value ? item.value.toString() : `key-${index}`}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <Pressable
                    style={[styles.optionRow, isSelected && styles.optionRowActive]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                    {isSelected && <Check color={COLORS.primary} size={20} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    ...FONTS.small,
    fontWeight: '700',
    color: COLORS.darkLight,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 48,
  },
  selectorText: {
    ...FONTS.regular,
    color: COLORS.dark,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.textLight,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
    minHeight: 300,
    ...SHADOWS.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.dark,
  },
  closeBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionRowActive: {
    backgroundColor: `${COLORS.primary}08`,
  },
  optionText: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  optionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
