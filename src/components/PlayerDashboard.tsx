import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Golfer, GolferHeadToHead } from '../types';
import { theme } from '../theme';
import { Users, TrendingUp, TrendingDown, DollarSign, Award, ChevronDown, UserCheck } from 'lucide-react-native';

interface PlayerDashboardProps {
  golfers: Golfer[];
  headToHeadMatrix: GolferHeadToHead[];
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  golfers,
  headToHeadMatrix,
}) => {
  const [selectedGolferId, setSelectedGolferId] = useState<string>(golfers[0]?.id || '');

  const activeGolferData = headToHeadMatrix.find(h => h.golferId === selectedGolferId) || headToHeadMatrix[0];
  const activeGolfer = golfers.find(g => g.id === selectedGolferId) || golfers[0];

  const totalWins = activeGolferData?.opponents.reduce((acc, o) => acc + o.wins, 0) || 0;
  const totalLosses = activeGolferData?.opponents.reduce((acc, o) => acc + o.losses, 0) || 0;
  const totalTies = activeGolferData?.opponents.reduce((acc, o) => acc + o.ties, 0) || 0;

  const totalMatches = totalWins + totalLosses + totalTies;
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Title */}
      <Text style={styles.title}>Player Head-to-Head Ledger</Text>
      <Text style={styles.subtitle}>Net winnings, losses, and match records aggregated across all played games</Text>

      {/* Golfer Selector Pills */}
      <Text style={styles.sectionHeader}>Select Player to View Ledger</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.golferSelectorRow}>
        {golfers.map(g => {
          const isSelected = g.id === selectedGolferId;
          const h2h = headToHeadMatrix.find(h => h.golferId === g.id);
          const net = h2h?.totalNetWinnings || 0;

          return (
            <TouchableOpacity
              key={g.id}
              style={[styles.golferChip, isSelected && styles.golferChipSelected]}
              onPress={() => setSelectedGolferId(g.id)}
              activeOpacity={0.8}
            >
              <UserCheck size={14} color={isSelected ? theme.colors.primary : theme.colors.textMuted} />
              <Text style={[styles.golferChipText, isSelected && styles.golferChipTextSelected]}>
                {g.name}
              </Text>
              <View style={[styles.netPill, net >= 0 ? styles.netPosPill : styles.netNegPill]}>
                <Text style={[styles.netPillText, net >= 0 ? styles.netPosText : styles.netNegText]}>
                  {net >= 0 ? `+$${net.toFixed(0)}` : `-$${Math.abs(net).toFixed(0)}`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Stats Card for Selected Golfer */}
      {activeGolfer && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarText}>{activeGolfer.name.charAt(0)}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.selectedGolferName}>{activeGolfer.name}</Text>
              <Text style={styles.selectedGolferSub}>
                Handicap Index: {activeGolfer.handicapIndex > 0 ? activeGolfer.handicapIndex : `+${Math.abs(activeGolfer.handicapIndex)}`} • {activeGolfer.preferredPaymentMethod}: {activeGolfer.paymentHandle}
              </Text>
            </View>

            <View style={[styles.netTotalBadge, (activeGolferData?.totalNetWinnings || 0) >= 0 ? styles.bgPos : styles.bgNeg]}>
              <Text style={styles.netTotalLabel}>Lifetime Net</Text>
              <Text style={[styles.netTotalValue, (activeGolferData?.totalNetWinnings || 0) >= 0 ? styles.textPos : styles.textNeg]}>
                {(activeGolferData?.totalNetWinnings || 0) >= 0 ? `+$${activeGolferData.totalNetWinnings.toFixed(2)}` : `-$${Math.abs(activeGolferData.totalNetWinnings).toFixed(2)}`}
              </Text>
            </View>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{activeGolferData?.gamesCount || 0}</Text>
              <Text style={styles.metricLabel}>Games Played</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
                {totalWins}W - {totalLosses}L {totalTies > 0 ? `- ${totalTies}T` : ''}
              </Text>
              <Text style={styles.metricLabel}>Head-to-Head</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{winRate}%</Text>
              <Text style={styles.metricLabel}>Win Rate</Text>
            </View>
          </View>
        </View>
      )}

      {/* Opponent Matrix List */}
      <Text style={[styles.sectionHeader, { marginTop: 20 }]}>
        Opponent Head-to-Head Records ({activeGolferData?.opponents.length || 0})
      </Text>

      {!activeGolferData || activeGolferData.opponents.length === 0 ? (
        <View style={styles.emptyOpponentCard}>
          <Users size={32} color={theme.colors.textMuted} />
          <Text style={styles.emptyOpponentTitle}>No Opponent Records Yet</Text>
          <Text style={styles.emptyOpponentSub}>Complete matches with other golfers to generate head-to-head winnings ledgers</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {activeGolferData.opponents.map(opp => {
            const isProfit = opp.netWinnings >= 0;

            return (
              <View key={opp.opponentId} style={styles.opponentCard}>
                <View style={styles.opponentLeft}>
                  <View style={[styles.oppAvatar, isProfit ? styles.oppAvatarPos : styles.oppAvatarNeg]}>
                    <Text style={[styles.oppAvatarText, isProfit ? styles.textPos : styles.textNeg]}>
                      {opp.opponentName.charAt(0)}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.oppName}>{opp.opponentName}</Text>
                    <Text style={styles.oppRecordText}>
                      {opp.gamesPlayed} {opp.gamesPlayed === 1 ? 'Game' : 'Games'} • {opp.wins} Win{opp.wins === 1 ? '' : 's'}, {opp.losses} Loss{opp.losses === 1 ? '' : 'es'} {opp.ties > 0 ? `, ${opp.ties} Tie` : ''}
                    </Text>
                  </View>
                </View>

                {/* Net Badge */}
                <View style={[styles.oppNetBadge, isProfit ? styles.bgPos : styles.bgNeg]}>
                  {isProfit ? (
                    <TrendingUp size={14} color="#166534" />
                  ) : (
                    <TrendingDown size={14} color="#991b1b" />
                  )}
                  <Text style={[styles.oppNetText, isProfit ? styles.textPos : styles.textNeg]}>
                    {isProfit ? `+$${opp.netWinnings.toFixed(2)}` : `-$${Math.abs(opp.netWinnings).toFixed(2)}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2, marginBottom: 16 },
  sectionHeader: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  golferSelectorRow: { marginBottom: 16 },
  golferChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, ...theme.shadows.card },
  golferChipSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  golferChipText: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary },
  golferChipTextSelected: { color: theme.colors.primary },
  netPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  netPosPill: { backgroundColor: '#dcfce7' },
  netNegPill: { backgroundColor: '#fee2e2' },
  netPillText: { fontSize: 10, fontWeight: '800' },
  netPosText: { color: '#166534' },
  netNegText: { color: '#991b1b' },
  summaryCard: { backgroundColor: theme.colors.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: theme.colors.cardBorder, paddingBottom: 14 },
  avatarBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primaryBorder },
  avatarText: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },
  selectedGolferName: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary },
  selectedGolferSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  netTotalBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignItems: 'flex-end', borderWidth: 1 },
  bgPos: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  bgNeg: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  netTotalLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted },
  netTotalValue: { fontSize: 15, fontWeight: '800' },
  textPos: { color: '#166534' },
  textNeg: { color: '#991b1b' },
  metricsGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metricBox: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder },
  metricValue: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  metricLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 2 },
  emptyOpponentCard: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center' },
  emptyOpponentTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 8 },
  emptyOpponentSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
  opponentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.cardBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  opponentLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  oppAvatar: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  oppAvatarPos: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  oppAvatarNeg: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  oppAvatarText: { fontSize: 14, fontWeight: '800' },
  oppName: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  oppRecordText: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  oppNetBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  oppNetText: { fontSize: 13, fontWeight: '800' },
});
