import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Game } from '../types';
import { computeGameResults } from '../services/gameStorage';
import { theme } from '../theme';
import { PlusCircle, Play, CheckCircle2, Flag, Users, DollarSign, Edit3, Award, Clock, ArrowRight } from 'lucide-react-native';

interface DashboardLandingProps {
  games: Game[];
  onSelectGame: (gameId: string, initialTab?: 'scoring' | 'setup' | 'results') => void;
  onOpenNewGameModal: () => void;
  onReopenGame: (gameId: string) => void;
}

export const DashboardLanding: React.FC<DashboardLandingProps> = ({
  games,
  onSelectGame,
  onOpenNewGameModal,
  onReopenGame,
}) => {
  const ongoingGames = games.filter(g => g.status === 'in_progress');
  const completedGames = games.filter(g => g.status === 'completed');

  const totalActive = ongoingGames.length;
  const totalCompleted = completedGames.length;

  const getHoleCompletionCount = (game: Game) => {
    let completedCount = 0;
    for (let h = 0; h < 18; h++) {
      const allEntered = game.config.participants.every(
        p => p.grossScores[h] !== null && p.grossScores[h] !== undefined && (p.grossScores[h] as number) > 0
      );
      if (allEntered) completedCount++;
    }
    return completedCount;
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'MATCH_PLAY_1V1': return '1v1 Match Play';
      case 'MATCH_PLAY_ALL_VS_ALL': return 'Round-Robin';
      case 'MATCH_PLAY_TEAMS': return '2v2 Team Match Play';
      case 'STROKE_PLAY': return 'Stroke Play';
      case 'SKINS': return 'Skins Game';
      default: return format;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Hero Welcome Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeaderRow}>
          <View>
            <Text style={styles.heroTitle}>GolfMatch Dashboard</Text>
            <Text style={styles.heroSubtitle}>Track matches, skins carryovers, & opponent ledgers</Text>
          </View>

          <TouchableOpacity style={styles.newGameBtn} onPress={onOpenNewGameModal} activeOpacity={0.85}>
            <PlusCircle size={18} color="#ffffff" />
            <Text style={styles.newGameBtnText}>Start New Game</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stat Summary Cards */}
        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.colors.primaryLight }]}>
              <Play size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValue}>{totalActive}</Text>
            <Text style={styles.statLabel}>Active Games</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: '#dcfce7' }]}>
              <CheckCircle2 size={16} color="#166534" />
            </View>
            <Text style={styles.statValue}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: '#fef3c7' }]}>
              <DollarSign size={16} color="#b45309" />
            </View>
            <Text style={styles.statValue}>{games.length}</Text>
            <Text style={styles.statLabel}>Total Matches</Text>
          </View>
        </View>
      </View>

      {/* Ongoing Games Section */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.statusDotActive} />
          <Text style={styles.sectionTitle}>Ongoing Games ({ongoingGames.length})</Text>
        </View>

        <TouchableOpacity onPress={onOpenNewGameModal} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <PlusCircle size={14} color={theme.colors.primary} />
          <Text style={styles.linkText}>New Match</Text>
        </TouchableOpacity>
      </View>

      {ongoingGames.length === 0 ? (
        <View style={styles.emptyCard}>
          <Flag size={32} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Ongoing Games</Text>
          <Text style={styles.emptySubtitle}>Start a new match or skins round to begin tracking scores</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={onOpenNewGameModal}>
            <Text style={styles.emptyBtnText}>Create New Game</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {ongoingGames.map(game => {
            const completedHoles = getHoleCompletionCount(game);
            const pct = Math.round((completedHoles / 18) * 100);
            const results = computeGameResults(game);
            const statusSummary = game.config.gameFormat === 'SKINS'
              ? `${results.skinsResults?.totalSkinsWon || 0} Skins Won`
              : results.overall18.scoreSummary;

            return (
              <View key={game.id} style={styles.gameCard}>
                <View style={styles.gameCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.gameTitle}>{game.name}</Text>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    </View>
                    <Text style={styles.gameSubtitle}>
                      {game.config.course.name} ({game.config.selectedTee.name}) • {getFormatLabel(game.config.gameFormat)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.resumeBtn}
                    onPress={() => onSelectGame(game.id, 'scoring')}
                    activeOpacity={0.8}
                  >
                    <Edit3 size={14} color="#ffffff" />
                    <Text style={styles.resumeBtnText}>Scores</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress Bar & Status */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressText}>Progress: {completedHoles} / 18 Holes ({pct}%)</Text>
                    <Text style={styles.statusSummaryText}>{statusSummary}</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                  </View>
                </View>

                {/* Player List Pills */}
                <View style={styles.playerRow}>
                  {game.config.participants.map(p => (
                    <View key={p.golfer.id} style={styles.playerChip}>
                      <Users size={12} color={theme.colors.textSecondary} />
                      <Text style={styles.playerChipText}>{p.golfer.name} ({p.courseHandicap})</Text>
                    </View>
                  ))}
                </View>

                {/* Quick Action Footer */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    onPress={() => onSelectGame(game.id, 'setup')}
                  >
                    <Text style={styles.secondaryActionText}>Edit Rules</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    onPress={() => onSelectGame(game.id, 'results')}
                  >
                    <Text style={styles.secondaryActionText}>View Settlement</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Completed Games History Section */}
      <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} color="#166534" />
          <Text style={styles.sectionTitle}>Completed Games ({completedGames.length})</Text>
        </View>
      </View>

      {completedGames.length === 0 ? (
        <View style={styles.emptyCard}>
          <Clock size={28} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Completed Games Yet</Text>
          <Text style={styles.emptySubtitle}>Completed games and finalized settlements will appear here</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {completedGames.map(game => {
            const results = computeGameResults(game);
            const statusSummary = game.config.gameFormat === 'SKINS'
              ? `${results.skinsResults?.totalSkinsWon || 0} Skins Finalized`
              : results.overall18.scoreSummary;

            const completedDate = game.completedAt
              ? new Date(game.completedAt).toLocaleDateString()
              : new Date(game.createdAt).toLocaleDateString();

            return (
              <View key={game.id} style={[styles.gameCard, styles.completedGameCard]}>
                <View style={styles.gameCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.gameTitle}>{game.name}</Text>
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>COMPLETED</Text>
                      </View>
                    </View>
                    <Text style={styles.gameSubtitle}>
                      {game.config.course.name} • {getFormatLabel(game.config.gameFormat)} • {completedDate}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.viewResultBtn}
                    onPress={() => onSelectGame(game.id, 'results')}
                    activeOpacity={0.8}
                  >
                    <Award size={14} color={theme.colors.primary} />
                    <Text style={styles.viewResultBtnText}>Settlement</Text>
                  </TouchableOpacity>
                </View>

                {/* Status Summary & Reopen */}
                <View style={styles.completedSummaryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedSummaryLabel}>Final Outcome:</Text>
                    <Text style={styles.completedSummaryValue}>{statusSummary}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.reopenBtn}
                    onPress={() => onReopenGame(game.id)}
                  >
                    <Text style={styles.reopenBtnText}>Re-open Match</Text>
                  </TouchableOpacity>
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
  heroCard: { backgroundColor: theme.colors.cardBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.colors.cardBorder, marginBottom: 24, ...theme.shadows.card },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.4 },
  heroSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  newGameBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, ...theme.shadows.button },
  newGameBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  statGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center' },
  statIconBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusDotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.2 },
  linkText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  emptyCard: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center', marginVertical: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 10 },
  emptySubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center', maxWidth: 280 },
  emptyBtn: { marginTop: 14, backgroundColor: theme.colors.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  gameCard: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  completedGameCard: { backgroundColor: '#fafafa' },
  gameCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  gameTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  activeBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#86efac' },
  activeBadgeText: { fontSize: 9, fontWeight: '800', color: '#166534' },
  completedBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  completedBadgeText: { fontSize: 9, fontWeight: '800', color: '#4b5563' },
  gameSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  resumeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  resumeBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  viewResultBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.primaryLight, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  viewResultBtnText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
  progressContainer: { marginTop: 12, backgroundColor: theme.colors.background, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.cardBorder },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressText: { fontSize: 11, fontWeight: '700', color: theme.colors.textPrimary },
  statusSummaryText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
  progressBarTrack: { height: 6, backgroundColor: theme.colors.cardBorder, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary },
  playerRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 12 },
  playerChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.subtleBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  playerChipText: { fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary },
  cardFooter: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: theme.colors.cardBorder },
  secondaryActionBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center' },
  secondaryActionText: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  completedSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: theme.colors.cardBorder },
  completedSummaryLabel: { fontSize: 11, color: theme.colors.textMuted },
  completedSummaryValue: { fontSize: 13, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 1 },
  reopenBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.cardBorder },
  reopenBtnText: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
});
