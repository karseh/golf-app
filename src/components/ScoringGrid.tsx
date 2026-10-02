import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MatchConfig, MatchParticipant } from '../types';
import { getStrokesGivenForHole } from '../engine/handicap';
import { calculateSkins } from '../engine/skins';
import { ScorecardUploadModal } from './ScorecardUploadModal';
import { theme } from '../theme';
import { Camera, ChevronLeft, ChevronRight, Grid, Eye, Flame } from 'lucide-react-native';

interface ScoringGridProps {
  config: MatchConfig;
  onChangeScores: (participantId: string, grossScores: (number | null)[]) => void;
  onApplyParsedScores: (parsedData: { golferId: string; grossScores: number[] }[]) => void;
}

export const ScoringGrid: React.FC<ScoringGridProps> = ({
  config,
  onChangeScores,
  onApplyParsedScores,
}) => {
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const [selectedHoleNum, setSelectedHoleNum] = useState(1);

  const { selectedTee, participants, scoringMode, gameFormat } = config;
  const holes = selectedTee.holes;

  const lowestCH = scoringMode === 'NET' && participants.length > 0
    ? Math.min(...participants.map(p => p.courseHandicap))
    : 0;

  const skinsRes = gameFormat === 'SKINS' ? calculateSkins(config) : null;

  const handleScoreChange = (participant: MatchParticipant, holeIndex: number, text: string) => {
    const val = text === '' ? null : parseInt(text, 10);
    const updated = [...participant.grossScores];
    updated[holeIndex] = isNaN(val as any) ? null : val;
    onChangeScores(participant.golfer.id, updated);
  };

  const adjustScore = (participant: MatchParticipant, holeIndex: number, delta: number) => {
    const current = participant.grossScores[holeIndex] || holes[holeIndex].par;
    const nextVal = Math.max(1, current + delta);
    const updated = [...participant.grossScores];
    updated[holeIndex] = nextVal;
    onChangeScores(participant.golfer.id, updated);
  };

  const getSubtotal = (p: MatchParticipant, startHole: number, endHole: number) => {
    let grossTot = 0;
    let netTot = 0;
    for (let h = startHole; h <= endHole; h++) {
      const g = p.grossScores[h - 1];
      if (g) {
        grossTot += g;
        const effectiveCH = scoringMode === 'NET' ? p.courseHandicap - lowestCH : 0;
        const strokes = scoringMode === 'NET' ? getStrokesGivenForHole(effectiveCH, holes[h - 1].handicapIndex) : 0;
        netTot += g - strokes;
      }
    }
    return { grossTot, netTot };
  };

  const getScoreBadgeStyle = (gross: number | null, par: number) => {
    if (gross === null || gross === undefined) return styles.scoreNormal;
    const diff = gross - par;
    if (diff <= -2) return styles.scoreEagle;
    if (diff === -1) return styles.scoreBirdie;
    if (diff === 0) return styles.scorePar;
    if (diff === 1) return styles.scoreBogey;
    return styles.scoreDoubleBogey;
  };

  const activeHole = holes[selectedHoleNum - 1];

  return (
    <View style={styles.container}>
      {/* Controls Bar */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Match Scorecard</Text>
          <Text style={styles.subtitle}>{config.course.name} • {selectedTee.name} Tee (Par {selectedTee.par})</Text>
        </View>

        <TouchableOpacity style={styles.ocrButton} onPress={() => setShowOcrModal(true)}>
          <Camera size={15} color="#ffffff" />
          <Text style={styles.ocrButtonText}>AI Scan</Text>
        </TouchableOpacity>
      </View>

      {/* View Switcher & Skins Banner */}
      <View style={styles.viewSwitcherRow}>
        <View style={styles.viewSwitcher}>
          <TouchableOpacity
            style={[styles.switchPill, viewMode === 'grid' && styles.switchPillActive]}
            onPress={() => setViewMode('grid')}
          >
            <Grid size={13} color={viewMode === 'grid' ? theme.colors.primary : theme.colors.textMuted} />
            <Text style={[styles.switchText, viewMode === 'grid' && styles.switchTextActive]}>18-Hole Matrix</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchPill, viewMode === 'carousel' && styles.switchPillActive]}
            onPress={() => setViewMode('carousel')}
          >
            <Eye size={13} color={viewMode === 'carousel' ? theme.colors.primary : theme.colors.textMuted} />
            <Text style={[styles.switchText, viewMode === 'carousel' && styles.switchTextActive]}>Hole Focus View</Text>
          </TouchableOpacity>
        </View>

        {gameFormat === 'SKINS' && skinsRes && (
          <View style={styles.skinsSummaryChip}>
            <Flame size={14} color="#b45309" />
            <Text style={styles.skinsSummaryText}>Skins: ${config.skinsWager?.skinAmount || 5}/hole</Text>
          </View>
        )}
      </View>

      {/* 18-Hole Matrix */}
      {viewMode === 'grid' ? (
        <ScrollView horizontal style={styles.gridScrollView} contentContainerStyle={{ paddingBottom: 10 }}>
          <View>
            {/* Header Row */}
            <View style={styles.tableRowHeader}>
              <Text style={[styles.cell, styles.golferHeaderCell]}>Golfer / Hole</Text>
              {holes.map(h => {
                const holeSkinInfo = skinsRes?.holeByHole[h.holeNumber - 1];
                const isSkinWon = holeSkinInfo && holeSkinInfo.winnerGolferId;
                const isCarried = holeSkinInfo && holeSkinInfo.isTie;

                return (
                  <View key={h.holeNumber} style={[styles.cell, styles.holeHeaderCell, isSkinWon ? { backgroundColor: '#fef3c7' } : isCarried ? { backgroundColor: '#fee2e2' } : null]}>
                    <Text style={styles.holeNumText}>{h.holeNumber}</Text>
                    <Text style={styles.holeSubText}>P:{h.par}</Text>
                    {gameFormat === 'SKINS' && isCarried ? (
                      <Text style={styles.skinCarryTag}>Tie ({holeSkinInfo.skinsAtStake}S)</Text>
                    ) : gameFormat === 'SKINS' && isSkinWon ? (
                      <Text style={styles.skinWinTag}>Won ({holeSkinInfo.skinsWon}S)</Text>
                    ) : (
                      <Text style={styles.holeSubText}>H:{h.handicapIndex}</Text>
                    )}
                  </View>
                );
              })}
              <Text style={[styles.cell, styles.summaryHeaderCell]}>F9</Text>
              <Text style={[styles.cell, styles.summaryHeaderCell]}>B9</Text>
              <Text style={[styles.cell, styles.summaryHeaderCell]}>TOT</Text>
              {gameFormat === 'SKINS' && (
                <Text style={[styles.cell, styles.summaryHeaderCell, { color: '#b45309' }]}>SKINS</Text>
              )}
            </View>

            {/* Player Rows */}
            {participants.map(p => {
              const f9 = getSubtotal(p, 1, 9);
              const b9 = getSubtotal(p, 10, 18);
              const totGross = f9.grossTot + b9.grossTot;
              const totNet = f9.netTot + b9.netTot;
              const effectiveCH = scoringMode === 'NET' ? p.courseHandicap - lowestCH : 0;
              const skinsWonCount = skinsRes ? skinsRes.golferSkinCounts[p.golfer.id] || 0 : 0;

              return (
                <View key={p.golfer.id} style={styles.tableRow}>
                  <View style={[styles.cell, styles.golferHeaderCell]}>
                    <Text style={styles.golferName}>{p.golfer.name}</Text>
                    <Text style={styles.chBadge}>
                      CH: {p.courseHandicap} {scoringMode === 'NET' ? `(+${effectiveCH})` : ''}
                    </Text>
                  </View>

                  {holes.map((h, idx) => {
                    const strokes = scoringMode === 'NET' ? getStrokesGivenForHole(effectiveCH, h.handicapIndex) : 0;
                    const grossVal = p.grossScores[idx];
                    const netVal = grossVal !== null && grossVal !== undefined ? grossVal - strokes : '';
                    const isHoleSkinWinner = skinsRes?.holeByHole[idx]?.winnerGolferId === p.golfer.id;

                    return (
                      <View key={h.holeNumber} style={[styles.cell, styles.scoreCell, getScoreBadgeStyle(grossVal, h.par), isHoleSkinWinner ? { borderRightColor: '#b45309', borderLeftColor: '#b45309' } : null]}>
                        <TextInput
                          style={[styles.scoreInput, isHoleSkinWinner && { borderColor: '#b45309', borderWidth: 1.5 }]}
                          keyboardType="numeric"
                          placeholder="-"
                          placeholderTextColor={theme.colors.textMuted}
                          maxLength={2}
                          value={grossVal !== null && grossVal !== undefined ? grossVal.toString() : ''}
                          onChangeText={t => handleScoreChange(p, idx, t)}
                        />
                        {scoringMode === 'NET' && strokes > 0 && (
                          <Text style={styles.strokeDot}>{'•'.repeat(strokes)}</Text>
                        )}
                        {scoringMode === 'NET' && grossVal !== null && grossVal !== undefined && (
                          <Text style={styles.netText}>N:{netVal}</Text>
                        )}
                      </View>
                    );
                  })}

                  <View style={[styles.cell, styles.summaryCell]}>
                    <Text style={styles.summaryGross}>{f9.grossTot}</Text>
                    {scoringMode === 'NET' && <Text style={styles.summaryNet}>N:{f9.netTot}</Text>}
                  </View>

                  <View style={[styles.cell, styles.summaryCell]}>
                    <Text style={styles.summaryGross}>{b9.grossTot}</Text>
                    {scoringMode === 'NET' && <Text style={styles.summaryNet}>N:{b9.netTot}</Text>}
                  </View>

                  <View style={[styles.cell, styles.summaryCell, { backgroundColor: theme.colors.primaryLight }]}>
                    <Text style={[styles.summaryGross, { color: theme.colors.primary, fontSize: 15 }]}>{totGross}</Text>
                    {scoringMode === 'NET' && <Text style={[styles.summaryNet, { color: theme.colors.primary }]}>N:{totNet}</Text>}
                  </View>

                  {gameFormat === 'SKINS' && (
                    <View style={[styles.cell, styles.summaryCell, { backgroundColor: '#fef3c7' }]}>
                      <Text style={[styles.summaryGross, { color: '#b45309', fontSize: 15 }]}>{skinsWonCount} ⛳</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* Carousel Hole View */
        <View style={styles.carouselContainer}>
          <View style={styles.holeNavRow}>
            <TouchableOpacity
              style={styles.holeNavButton}
              disabled={selectedHoleNum === 1}
              onPress={() => setSelectedHoleNum(Math.max(1, selectedHoleNum - 1))}
            >
              <ChevronLeft size={18} color={theme.colors.textPrimary} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={styles.holeFocusTitle}>Hole {activeHole.holeNumber}</Text>
              <Text style={styles.holeFocusSub}>Par {activeHole.par} • Handicap Index #{activeHole.handicapIndex}</Text>
            </View>

            <TouchableOpacity
              style={styles.holeNavButton}
              disabled={selectedHoleNum === 18}
              onPress={() => setSelectedHoleNum(Math.min(18, selectedHoleNum + 1))}
            >
              <ChevronRight size={18} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 10, marginTop: 14 }}>
            {participants.map(p => {
              const effectiveCH = scoringMode === 'NET' ? p.courseHandicap - lowestCH : 0;
              const strokes = scoringMode === 'NET' ? getStrokesGivenForHole(effectiveCH, activeHole.handicapIndex) : 0;
              const grossVal = p.grossScores[selectedHoleNum - 1] || activeHole.par;
              const netVal = grossVal - strokes;

              return (
                <View key={p.golfer.id} style={styles.focusGolferCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.focusGolferName}>{p.golfer.name}</Text>
                    <Text style={styles.focusStrokesText}>
                      {scoringMode === 'NET' ? `Receives ${strokes} stroke(s) • Net: ${netVal}` : `Scratch`}
                    </Text>
                  </View>

                  <View style={styles.stepperRow}>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => adjustScore(p, selectedHoleNum - 1, -1)}>
                      <Text style={styles.stepBtnText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.focusScoreValue}>{grossVal}</Text>

                    <TouchableOpacity style={styles.stepBtn} onPress={() => adjustScore(p, selectedHoleNum - 1, 1)}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <ScorecardUploadModal
        visible={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        participants={participants}
        onApplyParsedScores={onApplyParsedScores}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary },
  ocrButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  ocrButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  viewSwitcherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  viewSwitcher: { flexDirection: 'row', gap: 6 },
  switchPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder },
  switchPillActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  switchText: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  switchTextActive: { color: theme.colors.primary },
  skinsSummaryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#fde68a' },
  skinsSummaryText: { fontSize: 11, fontWeight: '800', color: '#b45309' },
  gridScrollView: { backgroundColor: theme.colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  tableRowHeader: { flexDirection: 'row', backgroundColor: theme.colors.subtleBg, borderBottomWidth: 1, borderColor: theme.colors.cardBorder },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: theme.colors.cardBorder },
  cell: { width: 52, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: theme.colors.cardBorder },
  golferHeaderCell: { width: 130, paddingHorizontal: 10, alignItems: 'flex-start' },
  holeHeaderCell: { width: 52, paddingVertical: 4 },
  holeNumText: { fontSize: 12, fontWeight: '800', color: theme.colors.textPrimary },
  holeSubText: { fontSize: 9, color: theme.colors.textMuted },
  skinCarryTag: { fontSize: 8, fontWeight: '800', color: '#dc2626' },
  skinWinTag: { fontSize: 8, fontWeight: '800', color: '#b45309' },
  summaryHeaderCell: { width: 58, fontWeight: '800', color: theme.colors.textPrimary },
  golferName: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
  chBadge: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 1 },
  scoreCell: { width: 52, padding: 2, justifyContent: 'center', alignItems: 'center' },
  scoreNormal: { backgroundColor: 'transparent' },
  scoreEagle: { backgroundColor: theme.colors.eagleBg },
  scoreBirdie: { backgroundColor: theme.colors.birdieBg },
  scorePar: { backgroundColor: 'transparent' },
  scoreBogey: { backgroundColor: theme.colors.bogeyBg },
  scoreDoubleBogey: { backgroundColor: theme.colors.doubleBogeyBg },
  scoreInput: { width: 36, height: 30, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 6, textAlign: 'center', fontWeight: '800', fontSize: 13, color: theme.colors.textPrimary },
  strokeDot: { fontSize: 10, color: theme.colors.primary, fontWeight: 'bold', marginTop: -2 },
  netText: { fontSize: 9, color: theme.colors.textSecondary, fontWeight: '700' },
  summaryCell: { width: 58, justifyContent: 'center', alignItems: 'center' },
  summaryGross: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  summaryNet: { fontSize: 10, color: theme.colors.primary, fontWeight: '700' },
  carouselContainer: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  holeNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: theme.colors.cardBorder, paddingBottom: 10 },
  holeNavButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.subtleBg, justifyContent: 'center', alignItems: 'center' },
  holeFocusTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  holeFocusSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  focusGolferCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.colors.cardBorder },
  focusGolferName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  focusStrokesText: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 32, height: 32, borderRadius: 6, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary },
  focusScoreValue: { fontSize: 20, fontWeight: '800', color: theme.colors.primary, width: 26, textAlign: 'center' },
});
