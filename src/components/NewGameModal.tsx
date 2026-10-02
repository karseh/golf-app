import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Golfer, Course, TeeBox, GameFormat, ScoringMode, Wagers, SkinsWager, Game } from '../types';
import { BAY_AREA_COURSES } from '../data/bayAreaCourses';
import { theme } from '../theme';
import { X, Plus, Check, UserPlus, Flag, Target, Users, Layers, Shield, Flame, DollarSign, Percent } from 'lucide-react-native';

interface NewGameModalProps {
  visible: boolean;
  onClose: () => void;
  golfers: Golfer[];
  onAddGolfer: (golfer: Golfer) => void;
  onCreateGame: (
    name: string,
    course: Course,
    tee: TeeBox,
    format: GameFormat,
    mode: ScoringMode,
    allowancePct: number,
    wagers: Wagers,
    skinsWager: SkinsWager,
    selectedGolferIds: string[]
  ) => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  visible,
  onClose,
  golfers,
  onAddGolfer,
  onCreateGame,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [selectedCourse, setSelectedCourse] = useState<Course>(BAY_AREA_COURSES[0]);
  const [selectedTee, setSelectedTee] = useState<TeeBox>(BAY_AREA_COURSES[0].teeBoxes[0]);
  const [gameName, setGameName] = useState<string>(`${BAY_AREA_COURSES[0].name} Match`);
  const [selectedGolferIds, setSelectedGolferIds] = useState<string[]>([golfers[0]?.id, golfers[1]?.id].filter(Boolean));
  const [gameFormat, setGameFormat] = useState<GameFormat>('MATCH_PLAY_1V1');
  const [scoringMode, setScoringMode] = useState<ScoringMode>('NET');
  const [handicapAllowancePct, setHandicapAllowancePct] = useState<number>(1.0);
  const [wagers, setWagers] = useState<Wagers>({ front9: 10, back9: 10, overall18: 10 });
  const [skinsWager, setSkinsWager] = useState<SkinsWager>({ skinAmount: 5 });

  // Inline "Create Golfer" Form State
  const [showAddGolfer, setShowAddGolfer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHandicap, setNewHandicap] = useState('10.0');
  const [newHandle, setNewHandle] = useState('');
  const [newPayMethod, setNewPayMethod] = useState<'VENMO' | 'PAYPAL' | 'CASHAPP' | 'ZELLE'>('VENMO');

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setSelectedTee(course.teeBoxes[0]);
    if (!gameName || gameName.includes('Match') || gameName.includes('Skins')) {
      setGameName(`${course.name} Match`);
    }
  };

  const handleToggleGolfer = (id: string) => {
    setSelectedGolferIds(prev =>
      prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]
    );
  };

  const handleSaveNewGolfer = () => {
    if (!newName.trim()) return;
    const newGolfer: Golfer = {
      id: `g_${Date.now()}`,
      name: newName.trim(),
      handicapIndex: parseFloat(newHandicap) || 0,
      preferredPaymentMethod: newPayMethod,
      paymentHandle: newHandle.trim() || newName.toLowerCase().replace(/\s+/g, ''),
    };
    onAddGolfer(newGolfer);
    setSelectedGolferIds(prev => [...prev, newGolfer.id]);
    setNewName('');
    setNewHandle('');
    setShowAddGolfer(false);
  };

  const handleStartGame = () => {
    if (selectedGolferIds.length < 2) return;
    onCreateGame(
      gameName.trim() || `${selectedCourse.name} Round`,
      selectedCourse,
      selectedTee,
      gameFormat,
      scoringMode,
      handicapAllowancePct,
      wagers,
      skinsWager,
      selectedGolferIds
    );
    onClose();
  };

  const formats: { type: GameFormat; title: string; desc: string; icon: any }[] = [
    { type: 'MATCH_PLAY_1V1', title: '1v1 Match Play', desc: 'Hole-by-hole head-to-head match', icon: Target },
    { type: 'SKINS', title: 'Skins Game', desc: 'Low score wins hole. Ties carry forward!', icon: Flame },
    { type: 'MATCH_PLAY_ALL_VS_ALL', title: 'Round-Robin', desc: 'Simultaneous 1v1 matches across all players', icon: Users },
    { type: 'MATCH_PLAY_TEAMS', title: '2v2 Team Match Play', desc: 'Best ball team match', icon: Layers },
    { type: 'STROKE_PLAY', title: 'Stroke Play', desc: 'Total cumulative stroke competition', icon: Shield },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Create New Game</Text>
              <Text style={styles.modalSubtitle}>Step {step} of 3: {step === 1 ? 'Players' : step === 2 ? 'Course' : 'Format & Bets'}</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Stepper Indicator Bar */}
          <View style={styles.stepperBar}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
          </View>

          {/* Step 1: Select / Create Players */}
          {step === 1 && (
            <ScrollView style={styles.stepBody}>
              <Text style={styles.label}>Match Name</Text>
              <TextInput
                style={styles.textInput}
                value={gameName}
                onChangeText={setGameName}
                placeholder="e.g. Saturday Pebble Beach Classic"
              />

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.label}>Select Players ({selectedGolferIds.length} selected)</Text>
                <TouchableOpacity
                  style={styles.addPlayerLink}
                  onPress={() => setShowAddGolfer(!showAddGolfer)}
                >
                  <UserPlus size={14} color={theme.colors.primary} />
                  <Text style={styles.addPlayerLinkText}>Create Player on the fly</Text>
                </TouchableOpacity>
              </View>

              {/* Inline Create Golfer Form */}
              {showAddGolfer && (
                <View style={styles.inlineForm}>
                  <Text style={styles.inlineFormTitle}>Add New Player to Roster</Text>
                  <View style={{ gap: 8 }}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Player Full Name"
                      value={newName}
                      onChangeText={setNewName}
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        style={[styles.textInput, { flex: 1 }]}
                        placeholder="Handicap Index (e.g. 12.4)"
                        keyboardType="numeric"
                        value={newHandicap}
                        onChangeText={setNewHandicap}
                      />
                      <TextInput
                        style={[styles.textInput, { flex: 1 }]}
                        placeholder="Venmo/PayPal Handle"
                        value={newHandle}
                        onChangeText={setNewHandle}
                      />
                    </View>
                    <TouchableOpacity style={styles.saveGolferBtn} onPress={handleSaveNewGolfer}>
                      <Text style={styles.saveGolferBtnText}>Save & Add Player</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Roster Checklist */}
              <View style={{ gap: 8, marginTop: 8 }}>
                {golfers.map(g => {
                  const isChecked = selectedGolferIds.includes(g.id);
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.golferRow, isChecked && styles.golferRowChecked]}
                      onPress={() => handleToggleGolfer(g.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Check size={14} color="#ffffff" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.golferName}>{g.name}</Text>
                        <Text style={styles.golferSub}>Handicap Index: {g.handicapIndex} • {g.preferredPaymentMethod}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Step 2: Course & Tee Box */}
          {step === 2 && (
            <ScrollView style={styles.stepBody}>
              <Text style={styles.label}>Select Course</Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {BAY_AREA_COURSES.map(course => {
                  const isSelected = selectedCourse.id === course.id;
                  return (
                    <TouchableOpacity
                      key={course.id}
                      style={[styles.courseCard, isSelected && styles.courseCardSelected]}
                      onPress={() => handleSelectCourse(course)}
                    >
                      <Flag size={18} color={isSelected ? theme.colors.primary : theme.colors.textMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.courseName, isSelected && { color: theme.colors.primary }]}>{course.name}</Text>
                        <Text style={styles.courseSub}>{course.city}, {course.state}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Select Tee Box</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {selectedCourse.teeBoxes.map(tee => {
                  const isSelected = selectedTee.name === tee.name;
                  return (
                    <TouchableOpacity
                      key={tee.name}
                      style={[styles.teePill, isSelected && styles.teePillSelected]}
                      onPress={() => setSelectedTee(tee)}
                    >
                      <Text style={[styles.teeText, isSelected && { color: theme.colors.primary }]}>
                        {tee.name} (Slope {tee.slopeRating} / Par {tee.par})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Step 3: Game Format & Wagers */}
          {step === 3 && (
            <ScrollView style={styles.stepBody}>
              <Text style={styles.label}>Select Game Format</Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {formats.map(f => {
                  const isSelected = gameFormat === f.type;
                  const IconComp = f.icon;
                  return (
                    <TouchableOpacity
                      key={f.type}
                      style={[styles.formatCard, isSelected && styles.formatCardSelected]}
                      onPress={() => setGameFormat(f.type)}
                    >
                      <View style={[styles.iconBox, isSelected && { backgroundColor: theme.colors.primaryLight }]}>
                        <IconComp size={18} color={isSelected ? theme.colors.primary : theme.colors.textMuted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.formatTitle, isSelected && { color: theme.colors.primary }]}>{f.title}</Text>
                        <Text style={styles.formatDesc}>{f.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Scoring Mode & USGA Allowance */}
              <Text style={styles.label}>Scoring Mode & Allowance</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  style={[styles.pill, scoringMode === 'NET' && styles.pillActive]}
                  onPress={() => setScoringMode('NET')}
                >
                  <Text style={[styles.pillText, scoringMode === 'NET' && styles.pillTextActive]}>Net (Handicap)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pill, scoringMode === 'GROSS' && styles.pillActive]}
                  onPress={() => setScoringMode('GROSS')}
                >
                  <Text style={[styles.pillText, scoringMode === 'GROSS' && styles.pillTextActive]}>Gross (Scratch)</Text>
                </TouchableOpacity>
              </View>

              {scoringMode === 'NET' && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.subLabel}>Handicap Allowance %</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {[1.0, 0.9, 0.85, 0.8].map(pct => (
                      <TouchableOpacity
                        key={pct}
                        style={[styles.pill, handicapAllowancePct === pct && styles.pillActive]}
                        onPress={() => setHandicapAllowancePct(pct)}
                      >
                        <Percent size={12} color={handicapAllowancePct === pct ? theme.colors.primary : theme.colors.textMuted} />
                        <Text style={[styles.pillText, handicapAllowancePct === pct && styles.pillTextActive]}>
                          {Math.round(pct * 100)}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {gameFormat === 'SKINS' ? (
                <View style={styles.wagerBox}>
                  <Text style={styles.label}>Skins Amount per Hole ($)</Text>
                  <TextInput
                    style={styles.wagerInputLarge}
                    keyboardType="numeric"
                    value={skinsWager.skinAmount.toString()}
                    onChangeText={v => setSkinsWager({ skinAmount: parseFloat(v) || 0 })}
                  />
                  <Text style={styles.wagerHint}>
                    Each hole is worth ${skinsWager.skinAmount} per player. If 2+ players tie, skin carries forward!
                  </Text>
                </View>
              ) : (
                <View style={styles.wagerBox}>
                  <Text style={styles.label}>Nassau Segment Bets ($)</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Front 9 ($)</Text>
                      <TextInput
                        style={styles.wagerInput}
                        keyboardType="numeric"
                        value={wagers.front9.toString()}
                        onChangeText={v => setWagers({ ...wagers, front9: parseFloat(v) || 0 })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Back 9 ($)</Text>
                      <TextInput
                        style={styles.wagerInput}
                        keyboardType="numeric"
                        value={wagers.back9.toString()}
                        onChangeText={v => setWagers({ ...wagers, back9: parseFloat(v) || 0 })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Overall ($)</Text>
                      <TextInput
                        style={styles.wagerInput}
                        keyboardType="numeric"
                        value={wagers.overall18.toString()}
                        onChangeText={v => setWagers({ ...wagers, overall18: parseFloat(v) || 0 })}
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer Navigation Buttons */}
          <View style={styles.modalFooter}>
            {step > 1 ? (
              <TouchableOpacity style={styles.prevBtn} onPress={() => setStep((step - 1) as any)}>
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
            ) : <View />}

            {step < 3 ? (
              <TouchableOpacity
                style={[styles.nextBtn, selectedGolferIds.length < 2 && step === 1 && { opacity: 0.5 }]}
                disabled={selectedGolferIds.length < 2 && step === 1}
                onPress={() => setStep((step + 1) as any)}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.startBtn} onPress={handleStartGame}>
                <Text style={styles.startBtnText}>Start Match Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', minHeight: 520, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary },
  modalSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.subtleBg, justifyContent: 'center', alignItems: 'center' },
  stepperBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.cardBorder },
  stepDotActive: { backgroundColor: theme.colors.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: theme.colors.cardBorder, marginHorizontal: 6 },
  stepLineActive: { backgroundColor: theme.colors.primary },
  stepBody: { flex: 1 },
  label: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 6 },
  subLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 4 },
  textInput: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 10, padding: 10, fontSize: 14, color: theme.colors.textPrimary, marginBottom: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addPlayerLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addPlayerLinkText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  inlineForm: { backgroundColor: theme.colors.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.cardBorder, marginBottom: 14 },
  inlineFormTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 8 },
  saveGolferBtn: { backgroundColor: theme.colors.primary, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  saveGolferBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  golferRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.background },
  golferRowChecked: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.cardBorder, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  golferName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  golferSub: { fontSize: 11, color: theme.colors.textSecondary },
  courseCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.background },
  courseCardSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  courseName: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  courseSub: { fontSize: 11, color: theme.colors.textSecondary },
  teePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.background },
  teePillSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  teeText: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary },
  formatCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.background },
  formatCardSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.subtleBg, justifyContent: 'center', alignItems: 'center' },
  formatTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  formatDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.cardBorder },
  pillActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  pillText: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  pillTextActive: { color: theme.colors.primary },
  wagerBox: { backgroundColor: theme.colors.background, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.cardBorder, marginTop: 10 },
  wagerInputLarge: { backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 10, padding: 10, fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center' },
  wagerInput: { backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 8, padding: 8, fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center' },
  wagerHint: { fontSize: 11, color: theme.colors.textMuted, marginTop: 6, textAlign: 'center' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderColor: theme.colors.cardBorder, marginTop: 10 },
  prevBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.cardBorder },
  prevBtnText: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary },
  nextBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  nextBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  startBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, ...theme.shadows.button },
  startBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
