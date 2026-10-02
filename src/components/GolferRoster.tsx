import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Golfer, PaymentMethod } from '../types';
import { theme } from '../theme';
import { Plus, Check, Award, CreditCard, Edit2, Trash2, X } from 'lucide-react-native';

interface GolferRosterProps {
  golfers: Golfer[];
  onAddGolfer: (golfer: Golfer) => void;
  onUpdateGolfer?: (golfer: Golfer) => void;
  onDeleteGolfer?: (golferId: string) => void;
  selectedGolferIds: string[];
  onToggleSelectGolfer: (golferId: string) => void;
}

const paymentColors: Record<PaymentMethod, string> = {
  VENMO: theme.colors.venmo,
  PAYPAL: theme.colors.paypal,
  CASHAPP: theme.colors.cashapp,
  ZELLE: theme.colors.zelle,
};

export const GolferRoster: React.FC<GolferRosterProps> = ({
  golfers,
  onAddGolfer,
  onUpdateGolfer,
  onDeleteGolfer,
  selectedGolferIds,
  onToggleSelectGolfer,
}) => {
  const [name, setName] = useState('');
  const [handicapIndex, setHandicapIndex] = useState('14.0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VENMO');
  const [paymentHandle, setPaymentHandle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGolferId, setEditingGolferId] = useState<string | null>(null);

  const handleCreateOrUpdate = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a golfer name');
      return;
    }

    const hp = parseFloat(handicapIndex);
    if (isNaN(hp)) {
      Alert.alert('Validation Error', 'Please enter a valid handicap index');
      return;
    }

    if (editingGolferId && onUpdateGolfer) {
      const updated: Golfer = {
        id: editingGolferId,
        name: name.trim(),
        handicapIndex: hp,
        preferredPaymentMethod: paymentMethod,
        paymentHandle: paymentHandle.trim() || name.toLowerCase().replace(/\s+/g, ''),
      };
      onUpdateGolfer(updated);
      setEditingGolferId(null);
    } else {
      const newGolfer: Golfer = {
        id: `golfer-${Date.now()}`,
        name: name.trim(),
        handicapIndex: hp,
        preferredPaymentMethod: paymentMethod,
        paymentHandle: paymentHandle.trim() || name.toLowerCase().replace(/\s+/g, ''),
      };
      onAddGolfer(newGolfer);
    }

    setName('');
    setPaymentHandle('');
    setShowAddForm(false);
  };

  const handleStartEdit = (golfer: Golfer) => {
    setEditingGolferId(golfer.id);
    setName(golfer.name);
    setHandicapIndex(golfer.handicapIndex.toString());
    setPaymentMethod(golfer.preferredPaymentMethod);
    setPaymentHandle(golfer.paymentHandle);
    setShowAddForm(true);
  };

  const handleDelete = (golfer: Golfer) => {
    if (!onDeleteGolfer) return;
    Alert.alert(
      'Delete Golfer Profile',
      `Are you sure you want to remove "${golfer.name}" from your roster?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteGolfer(golfer.id) },
      ]
    );
  };

  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return str.slice(0, 2).toUpperCase();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Player Roster</Text>
          <Text style={styles.subtitle}>Select players for the match & manage payment profiles</Text>
        </View>

        <TouchableOpacity style={styles.addToggleBtn} onPress={() => {
          if (showAddForm) {
            setShowAddForm(false);
            setEditingGolferId(null);
          } else {
            setShowAddForm(true);
            setEditingGolferId(null);
            setName('');
            setPaymentHandle('');
          }
        }}>
          <Plus size={16} color={showAddForm ? theme.colors.textSecondary : '#ffffff'} />
          <Text style={[styles.addToggleText, showAddForm && { color: theme.colors.textSecondary }]}>
            {showAddForm ? 'Cancel' : 'Add Player'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add / Edit Golfer Form */}
      {showAddForm && (
        <View style={styles.addCard}>
          <Text style={styles.cardHeader}>{editingGolferId ? 'Edit Player Profile' : 'New Player Profile'}</Text>

          <View style={styles.formRow}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. John Smith"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Handicap Index</Text>
              <TextInput
                style={styles.input}
                placeholder="14.2"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={handicapIndex}
                onChangeText={setHandicapIndex}
              />
            </View>
          </View>

          <Text style={styles.label}>Preferred Settlement App</Text>
          <View style={styles.methodSelector}>
            {(['VENMO', 'PAYPAL', 'ZELLE', 'CASHAPP'] as PaymentMethod[]).map(method => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.methodChip,
                  paymentMethod === method && { backgroundColor: paymentColors[method], borderColor: paymentColors[method] },
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[
                  styles.methodChipText,
                  paymentMethod === method && { color: '#ffffff' },
                ]}>
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Handle / Username / Phone</Text>
            <TextInput
              style={styles.input}
              placeholder={
                paymentMethod === 'VENMO' ? '@johnsmith' :
                paymentMethod === 'PAYPAL' ? 'paypal.me/johnsmith' :
                paymentMethod === 'CASHAPP' ? '$johnsmith' : 'john@zelle.com'
              }
              placeholderTextColor={theme.colors.textMuted}
              value={paymentHandle}
              onChangeText={setPaymentHandle}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleCreateOrUpdate}>
            <Text style={styles.saveButtonText}>{editingGolferId ? 'Update Player Profile' : 'Save Player Profile'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Roster Section Header */}
      <View style={styles.counterRow}>
        <Text style={styles.sectionHeader}>Saved Players ({golfers.length})</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selectedGolferIds.length} Selected for Match</Text>
        </View>
      </View>

      {/* Players List */}
      <View style={styles.list}>
        {golfers.map(item => {
          const isSelected = selectedGolferIds.includes(item.id);
          const brandColor = paymentColors[item.preferredPaymentMethod];

          return (
            <View key={item.id} style={[styles.golferCard, isSelected && styles.golferCardSelected]}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                onPress={() => onToggleSelectGolfer(item.id)}
                activeOpacity={0.8}
              >
                {/* Avatar Circle */}
                <View style={[styles.avatar, isSelected ? { backgroundColor: theme.colors.primaryLight } : { backgroundColor: theme.colors.subtleBg }]}>
                  <Text style={[styles.avatarText, isSelected ? { color: theme.colors.primary } : { color: theme.colors.textSecondary }]}>
                    {getInitials(item.name)}
                  </Text>
                </View>

                {/* Details */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.golferName}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                      <Award size={11} color={theme.colors.primary} />
                      <Text style={styles.metaText}>
                        HCP: {item.handicapIndex >= 0 ? item.handicapIndex.toFixed(1) : `+${Math.abs(item.handicapIndex).toFixed(1)}`}
                      </Text>
                    </View>

                    <View style={[styles.metaPill, { backgroundColor: `${brandColor}12` }]}>
                      <CreditCard size={11} color={brandColor} />
                      <Text style={[styles.metaText, { color: brandColor, fontWeight: '700' }]}>
                        {item.preferredPaymentMethod}: {item.paymentHandle}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Action Buttons & Checkbox */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleStartEdit(item)}>
                  <Edit2 size={14} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                {onDeleteGolfer && golfers.length > 2 && (
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
                    <Trash2 size={14} color="#dc2626" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                  onPress={() => onToggleSelectGolfer(item.id)}
                >
                  {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  addToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addToggleText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  addCard: { backgroundColor: theme.colors.cardBg, borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  cardHeader: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 14 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.colors.textPrimary },
  methodSelector: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  methodChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.background },
  methodChipText: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary },
  saveButton: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  saveButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  badge: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  badgeText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  list: { gap: 10 },
  golferCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.cardBg, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, gap: 12, ...theme.shadows.card },
  golferCardSelected: { borderColor: theme.colors.primaryBorder, backgroundColor: '#ffffff' },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '800', fontSize: 15 },
  golferName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaText: { fontSize: 11, color: theme.colors.textSecondary },
  iconBtn: { padding: 6, borderRadius: 6, backgroundColor: theme.colors.subtleBg },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: theme.colors.cardBorder, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
});
