import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { GameFormat, ScoringMode, Wagers, SkinsWager, Golfer, Team } from '../types';
import { theme } from '../theme';
import { Target, Users, DollarSign, Shield, Percent, Layers, Flame } from 'lucide-react-native';

interface MatchSetupProps {
  gameFormat: GameFormat;
  onSelectGameFormat: (format: GameFormat) => void;
  scoringMode: ScoringMode;
  onSelectScoringMode: (mode: ScoringMode) => void;
  handicapAllowancePct: number;
  onSelectAllowancePct: (pct: number) => void;
  wagers: Wagers;
  onChangeWagers: (wagers: Wagers) => void;
  skinsWager?: SkinsWager;
  onChangeSkinsWager?: (skinsWager: SkinsWager) => void;
  selectedGolfers: Golfer[];
  teams: Team[];
  onChangeTeams: (teams: Team[]) => void;
}

export const MatchSetup: React.FC<MatchSetupProps> = ({
  gameFormat,
  onSelectGameFormat,
  scoringMode,
  onSelectScoringMode,
  handicapAllowancePct,
  onSelectAllowancePct,
  wagers,
  onChangeWagers,
  skinsWager = { skinAmount: 5 },
  onChangeSkinsWager,
  selectedGolfers,
  teams,
  onChangeTeams,
}) => {
  const formats: { type: GameFormat; title: string; desc: string; icon: any }[] = [
    { type: 'MATCH_PLAY_1V1', title: '1v1 Match Play', desc: 'Single hole-by-hole head-to-head match', icon: Target },
    { type: 'SKINS', title: 'Skins Game', desc: 'Lowest score wins hole. Ties carry over to next hole!', icon: Flame },
    { type: 'MATCH_PLAY_ALL_VS_ALL', title: 'All-vs-All Round-Robin', desc: 'Simultaneous 1v1 matches between all group players', icon: Users },
    { type: 'MATCH_PLAY_TEAMS', title: '2v2 Team Match Play', desc: 'Four-ball best ball team match (2 vs 2)', icon: Layers },
    { type: 'STROKE_PLAY', title: 'Stroke Play', desc: 'Total cumulative stroke competition across 18 holes', icon: Shield },
  ];

  const totalPot = wagers.front9 + wagers.back9 + wagers.overall18;

  const togglePlayerTeam = (golferId: string) => {
    const currentTeam1 = teams[0]?.playerIds || [];
    const isTeam1 = currentTeam1.includes(golferId);

    const newTeam1 = isTeam1 ? currentTeam1.filter(id => id !== golferId) : [...currentTeam1, golferId];
    const newTeam2 = selectedGolfers.map(g => g.id).filter(id => !newTeam1.includes(id));

    onChangeTeams([
      { id: 1, name: 'Team 1', playerIds: newTeam1 },
      { id: 2, name: 'Team 2', playerIds: newTeam2 },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <Text style={styles.title}>Match Rules & Wagers</Text>
      <Text style={styles.subtitle}>Configure game format, USGA handicap allowance %, and Nassau/Skins bets</Text>

      {/* 1. Format Selection */}
      <Text style={styles.sectionHeader}>1. Select Game Format</Text>
      <View style={styles.formatGrid}>
        {formats.map(f => {
          const isSelected = gameFormat === f.type;
          const IconComp = f.icon;
          return (
            <TouchableOpacity
              key={f.type}
              style={[styles.formatCard, isSelected && styles.formatCardSelected]}
              onPress={() => onSelectGameFormat(f.type)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, isSelected && { backgroundColor: theme.colors.primaryLight }]}>
                <IconComp size={18} color={isSelected ? theme.colors.primary : theme.colors.textMuted} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.formatTitle, isSelected && styles.formatTitleSelected]}>{f.title}</Text>
                <Text style={styles.formatDesc}>{f.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Team Selection */}
      {gameFormat === 'MATCH_PLAY_TEAMS' && (
        <View style={styles.teamSection}>
          <Text style={styles.sectionHeader}>Team Builder (Tap player to swap team)</Text>
          <View style={{ gap: 8 }}>
            {selectedGolfers.map(golfer => {
              const isTeam1 = teams[0]?.playerIds.includes(golfer.id);
              return (
                <TouchableOpacity
                  key={golfer.id}
                  style={[styles.teamRow, isTeam1 ? styles.team1Row : styles.team2Row]}
                  onPress={() => togglePlayerTeam(golfer.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.golferName}>{golfer.name}</Text>
                  <View style={[styles.teamBadge, isTeam1 ? { backgroundColor: '#dbeafe' } : { backgroundColor: theme.colors.primaryLight }]}>
                    <Text style={[styles.teamBadgeText, isTeam1 ? { color: '#1e40af' } : { color: theme.colors.primary }]}>
                      {isTeam1 ? 'Team 1' : 'Team 2'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 2. Scoring Mode */}
      <Text style={styles.sectionHeader}>2. Scoring Mode</Text>
      <View style={styles.rowSelector}>
        <TouchableOpacity
          style={[styles.pill, scoringMode === 'NET' && styles.pillActive]}
          onPress={() => onSelectScoringMode('NET')}
        >
          <Text style={[styles.pillText, scoringMode === 'NET' && styles.pillTextActive]}>Net (Handicap Adjusted)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, scoringMode === 'GROSS' && styles.pillActive]}
          onPress={() => onSelectScoringMode('GROSS')}
        >
          <Text style={[styles.pillText, scoringMode === 'GROSS' && styles.pillTextActive]}>Gross (Scratch)</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Handicap Allowance % */}
      {scoringMode === 'NET' && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionHeader}>3. USGA Handicap Allowance %</Text>
          <View style={styles.rowSelector}>
            {[1.0, 0.9, 0.85, 0.8].map(pct => (
              <TouchableOpacity
                key={pct}
                style={[styles.pill, handicapAllowancePct === pct && styles.pillActive]}
                onPress={() => onSelectAllowancePct(pct)}
              >
                <Percent size={13} color={handicapAllowancePct === pct ? theme.colors.primary : theme.colors.textMuted} />
                <Text style={[styles.pillText, handicapAllowancePct === pct && styles.pillTextActive]}>
                  {Math.round(pct * 100)}% Allowance
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 4. Bets Configuration */}
      {gameFormat === 'SKINS' ? (
        <View style={{ marginTop: 16 }}>
          <View style={styles.wagerHeaderRow}>
            <Text style={styles.sectionHeader}>4. Skins Bet Config</Text>
            <View style={styles.totalPotBadge}>
              <Text style={styles.totalPotText}>${skinsWager.skinAmount} / hole / player</Text>
            </View>
          </View>

          <View style={styles.wagerCard}>
            <Text style={styles.wagerLabel}>Skins Dollar Amount per Hole ($)</Text>
            <TextInput
              style={styles.wagerInput}
              keyboardType="numeric"
              value={skinsWager.skinAmount.toString()}
              onChangeText={v => onChangeSkinsWager && onChangeSkinsWager({ skinAmount: parseFloat(v) || 0 })}
            />
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 16 }}>
          <View style={styles.wagerHeaderRow}>
            <Text style={styles.sectionHeader}>4. Nassau Segment Bets ($)</Text>
            <View style={styles.totalPotBadge}>
              <Text style={styles.totalPotText}>Total Pot: ${totalPot} / player</Text>
            </View>
          </View>

          <View style={styles.wagerRow}>
            <View style={styles.wagerCard}>
              <Text style={styles.wagerLabel}>Front 9 ($)</Text>
              <TextInput
                style={styles.wagerInput}
                keyboardType="numeric"
                value={wagers.front9.toString()}
                onChangeText={v => onChangeWagers({ ...wagers, front9: parseFloat(v) || 0 })}
              />
            </View>

            <View style={styles.wagerCard}>
              <Text style={styles.wagerLabel}>Back 9 ($)</Text>
              <TextInput
                style={styles.wagerInput}
                keyboardType="numeric"
                value={wagers.back9.toString()}
                onChangeText={v => onChangeWagers({ ...wagers, back9: parseFloat(v) || 0 })}
              />
            </View>

            <View style={styles.wagerCard}>
              <Text style={styles.wagerLabel}>Overall 18 ($)</Text>
              <TextInput
                style={styles.wagerInput}
                keyboardType="numeric"
                value={wagers.overall18.toString()}
                onChangeText={v => onChangeWagers({ ...wagers, overall18: parseFloat(v) || 0 })}
              />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2, marginBottom: 16 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10, marginTop: 8 },
  formatGrid: { gap: 8, marginBottom: 16 },
  formatCard: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, flexDirection: 'row', alignItems: 'center', gap: 12, ...theme.shadows.card },
  formatCardSelected: { borderColor: theme.colors.primaryBorder, backgroundColor: theme.colors.primaryLight, borderWidth: 1.5 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.subtleBg, justifyContent: 'center', alignItems: 'center' },
  formatTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  formatTitleSelected: { color: theme.colors.primary },
  formatDesc: { fontSize: 12, color: theme.colors.textMuted, marginTop: 1 },
  teamSection: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 14, marginVertical: 12, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1 },
  team1Row: { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },
  team2Row: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  golferName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  teamBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  teamBadgeText: { fontSize: 11, fontWeight: '700' },
  rowSelector: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  pillActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  pillText: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary },
  pillTextActive: { color: theme.colors.primary },
  wagerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalPotBadge: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  totalPotText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
  wagerRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  wagerCard: { flex: 1, backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  wagerLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 6 },
  wagerInput: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 8, padding: 8, fontSize: 16, textAlign: 'center', fontWeight: '800', color: theme.colors.textPrimary },
});
