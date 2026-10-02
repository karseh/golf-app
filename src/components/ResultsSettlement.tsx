import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, TextInput } from 'react-native';
import { MatchConfig, MatchResults, SettlementResult, GameStatus } from '../types';
import { theme } from '../theme';
import { Trophy, Copy, Send, ExternalLink, FileSpreadsheet, Check, CheckCircle2, Flame, RefreshCw } from 'lucide-react-native';
import { exportMatchToGoogleSheets } from '../services/googleSheets';

interface ResultsSettlementProps {
  config: MatchConfig;
  matchResults: MatchResults;
  settlement: SettlementResult;
  gameStatus?: GameStatus;
  onMarkCompleted?: () => void;
  onReopenGame?: () => void;
}

export const ResultsSettlement: React.FC<ResultsSettlementProps> = ({
  config,
  matchResults,
  settlement,
  gameStatus = 'in_progress',
  onMarkCompleted,
  onReopenGame,
}) => {
  const [sheetId, setSheetId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showSheetsConfig, setShowSheetsConfig] = useState(false);
  const [isExported, setIsExported] = useState(false);

  const isSkins = config.gameFormat === 'SKINS';
  const skinsRes = matchResults.skinsResults;

  const handleOpenPaymentUrl = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(err => {
      console.warn('Could not open payment deep link', err);
      Alert.alert('Payment Link', `Payment URL: ${url}`);
    });
  };

  const handleCopyTextInvoice = () => {
    let text = `⛳ ${config.course.name} Match Settlement\n`;
    text += `Format: ${config.gameFormat.replace(/_/g, ' ')} (${config.scoringMode})\n`;
    text += `------------------------------------\n`;
    settlement.transactions.forEach(t => {
      text += `💵 ${t.fromGolfer.name} owes ${t.toGolfer.name} $${t.amount.toFixed(2)} via ${t.toGolfer.preferredPaymentMethod}\n`;
      text += `Pay Link: ${t.paymentUrl}\n\n`;
    });

    Alert.alert('Invoice Summary Copied!', text);
  };

  const handleSyncToSheets = async () => {
    const res = await exportMatchToGoogleSheets(
      { sheetId: sheetId.trim(), webhookUrl: webhookUrl.trim() },
      config,
      matchResults,
      settlement
    );

    if (res.success) {
      setIsExported(true);
      Alert.alert('Google Sheets Sync', res.message);
    } else {
      Alert.alert('Google Sheets Error', res.message);
    }
  };

  const getBrandColor = (method: string) => {
    switch (method) {
      case 'VENMO': return theme.colors.venmo;
      case 'PAYPAL': return theme.colors.paypal;
      case 'CASHAPP': return theme.colors.cashapp;
      case 'ZELLE': return theme.colors.zelle;
      default: return theme.colors.primary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.title}>Results & Settlement</Text>
            {gameStatus === 'completed' ? (
              <View style={styles.statusBadgeCompleted}>
                <Text style={styles.statusBadgeTextCompleted}>COMPLETED</Text>
              </View>
            ) : (
              <View style={styles.statusBadgeActive}>
                <Text style={styles.statusBadgeTextActive}>IN PROGRESS</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>{config.course.name} • {config.gameFormat.replace(/_/g, ' ')}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={styles.sheetsToggleBtn} onPress={() => setShowSheetsConfig(!showSheetsConfig)}>
            <FileSpreadsheet size={13} color={theme.colors.primary} />
            <Text style={styles.sheetsToggleText}>Sheets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyTextInvoice}>
            <Copy size={13} color={theme.colors.primary} />
            <Text style={styles.copyBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Completion Action Banner */}
      <View style={styles.completionBanner}>
        {gameStatus === 'completed' ? (
          <View style={styles.completionRow}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#166534" />
              <Text style={styles.completionTextCompleted}>This game is marked as Completed.</Text>
            </View>
            {onReopenGame && (
              <TouchableOpacity style={styles.reopenActionBtn} onPress={onReopenGame}>
                <RefreshCw size={12} color={theme.colors.textSecondary} />
                <Text style={styles.reopenActionText}>Re-open Match</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.completionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.completionTextActive}>Finished scoring this round?</Text>
              <Text style={styles.completionSubText}>Marking completed updates global opponent ledgers</Text>
            </View>
            {onMarkCompleted && (
              <TouchableOpacity style={styles.completeMatchBtn} onPress={onMarkCompleted} activeOpacity={0.85}>
                <CheckCircle2 size={15} color="#ffffff" />
                <Text style={styles.completeMatchBtnText}>Complete & Close Game</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Google Sheets Database Card */}
      {showSheetsConfig && (
        <View style={styles.sheetsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <FileSpreadsheet size={18} color={theme.colors.primary} />
            <Text style={styles.sheetsTitle}>Google Sheets Database Integration</Text>
          </View>
          <Text style={styles.sheetsSub}>
            Sync match scores, rosters, and settlement logs directly into your Google Sheet!
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Google Sheet ID or Webhook URL</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1BxiMVs0XRnt3kg_fPxp8w5JqsDfdA... or Apps Script Webhook"
              placeholderTextColor={theme.colors.textMuted}
              value={sheetId}
              onChangeText={setSheetId}
            />
          </View>

          <TouchableOpacity style={styles.exportBtn} onPress={handleSyncToSheets}>
            {isExported ? <Check size={15} color="#ffffff" /> : <FileSpreadsheet size={15} color="#ffffff" />}
            <Text style={styles.exportBtnText}>
              {isExported ? 'Synced to Google Sheet!' : 'Sync Match to Google Sheet'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skins Breakdown Section */}
      {isSkins && skinsRes ? (
        <View style={styles.skinsCard}>
          <View style={styles.skinsCardHeader}>
            <Flame size={18} color="#b45309" />
            <Text style={styles.skinsCardTitle}>Skins Game Breakdown (${config.skinsWager?.skinAmount || 5}/skin)</Text>
          </View>

          {/* Skins Tally per Golfer */}
          <View style={styles.skinsGolferGrid}>
            {config.participants.map(p => {
              const wonCount = skinsRes.golferSkinCounts[p.golfer.id] || 0;
              return (
                <View key={p.golfer.id} style={styles.skinsGolferBox}>
                  <Text style={styles.skinsGolferName}>{p.golfer.name}</Text>
                  <Text style={styles.skinsCountText}>{wonCount} Skins Won</Text>
                </View>
              );
            })}
          </View>

          {/* Hole by Hole Skins log */}
          <Text style={[styles.label, { marginTop: 12, marginBottom: 6 }]}>Hole-by-Hole Skins Log</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skinsHoleRow}>
            {skinsRes.holeByHole.map(h => {
              const winner = config.participants.find(p => p.golfer.id === h.winnerGolferId);
              return (
                <View key={h.holeNumber} style={[styles.skinsHoleChip, h.isTie ? styles.skinsChipTie : h.winnerGolferId ? styles.skinsChipWin : null]}>
                  <Text style={styles.skinsHoleNum}>H{h.holeNumber}</Text>
                  {h.isTie ? (
                    <Text style={styles.skinsTieText}>TIED ({h.skinsAtStake}S carried)</Text>
                  ) : h.winnerGolferId ? (
                    <Text style={styles.skinsWinnerText}>{winner?.golfer.name.split(' ')[0]} ({h.skinsWon}S)</Text>
                  ) : (
                    <Text style={styles.skinsUnplayedText}>-</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        /* Nassau Segment Champions */
        <View>
          <Text style={styles.sectionHeader}>🏆 Nassau Segment Champions</Text>
          <View style={styles.segmentGrid}>
            <View style={styles.segmentCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.segmentTitle}>Front 9 (Holes 1-9)</Text>
                <Text style={styles.wagerBadge}>Wager: ${config.wagers.front9}</Text>
              </View>
              <View style={styles.winnerRow}>
                <Trophy size={15} color={theme.colors.primary} />
                <Text style={styles.segmentWinner}>{matchResults.front9.scoreSummary}</Text>
              </View>
            </View>

            <View style={styles.segmentCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.segmentTitle}>Back 9 (Holes 10-18)</Text>
                <Text style={styles.wagerBadge}>Wager: ${config.wagers.back9}</Text>
              </View>
              <View style={styles.winnerRow}>
                <Trophy size={15} color={theme.colors.primary} />
                <Text style={styles.segmentWinner}>{matchResults.back9.scoreSummary}</Text>
              </View>
            </View>

            <View style={styles.segmentCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.segmentTitle}>Overall 18 Holes</Text>
                <Text style={styles.wagerBadge}>Wager: ${config.wagers.overall18}</Text>
              </View>
              <View style={styles.winnerRow}>
                <Trophy size={15} color={theme.colors.primary} />
                <Text style={styles.segmentWinner}>{matchResults.overall18.scoreSummary}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Net Financial Balances */}
      <Text style={styles.sectionHeader}>💵 Net Financial Balances</Text>
      <View style={styles.balanceList}>
        {settlement.golferBalances.map(b => {
          const isWinner = b.totalWonLost > 0.001;
          const isLoser = b.totalWonLost < -0.001;
          return (
            <View key={b.golferId} style={styles.balanceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.golferName}>{b.name}</Text>
                <Text style={styles.breakdownText}>
                  {isSkins ? `Skins Outcome` : `F9: $${b.segmentBreakdown.front9} | B9: $${b.segmentBreakdown.back9} | Tot18: $${b.segmentBreakdown.overall18}`}
                </Text>
              </View>

              <Text style={[
                styles.totalWonLostText,
                isWinner && styles.winnerGreen,
                isLoser && styles.loserRed,
              ]}>
                {isWinner ? `+$${b.totalWonLost.toFixed(2)}` : isLoser ? `-$${Math.abs(b.totalWonLost).toFixed(2)}` : '$0.00'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Payment Apps Settlement */}
      <Text style={styles.sectionHeader}>📲 Auto-Settle via Payment Apps</Text>
      {settlement.transactions.length === 0 ? (
        <View style={styles.noPaymentsBox}>
          <Text style={styles.noPaymentsText}>All square! No payments required between players.</Text>
        </View>
      ) : (
        settlement.transactions.map((t, idx) => {
          const brandColor = getBrandColor(t.toGolfer.preferredPaymentMethod);
          return (
            <View key={idx} style={styles.transactionCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnSummary}>{t.paymentSummaryText}</Text>
                <Text style={styles.txnDetails}>
                  Payee: {t.toGolfer.name} ({t.toGolfer.preferredPaymentMethod}: {t.toGolfer.paymentHandle})
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.payButton, { backgroundColor: brandColor }]}
                onPress={() => handleOpenPaymentUrl(t.paymentUrl)}
                activeOpacity={0.85}
              >
                <Send size={15} color="#ffffff" />
                <Text style={styles.payButtonText}>
                  Pay ${t.amount.toFixed(2)} via {t.toGolfer.preferredPaymentMethod}
                </Text>
                <ExternalLink size={13} color="#ffffff" />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  statusBadgeActive: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#86efac' },
  statusBadgeTextActive: { fontSize: 9, fontWeight: '800', color: '#166534' },
  statusBadgeCompleted: { backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  statusBadgeTextCompleted: { fontSize: 9, fontWeight: '800', color: '#4b5563' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  copyBtnText: { color: theme.colors.primary, fontWeight: '700', fontSize: 12 },
  sheetsToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  sheetsToggleText: { color: theme.colors.primary, fontWeight: '700', fontSize: 12 },
  completionBanner: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, marginBottom: 16, ...theme.shadows.card },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  completionTextActive: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  completionSubText: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  completeMatchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, ...theme.shadows.button },
  completeMatchBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  completionTextCompleted: { fontSize: 13, fontWeight: '700', color: '#166534' },
  reopenActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.cardBorder },
  reopenActionText: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  sheetsCard: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.primaryBorder, ...theme.shadows.card },
  sheetsTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary },
  sheetsSub: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 12 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: theme.colors.textPrimary },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.colors.primary, paddingVertical: 10, borderRadius: 8 },
  exportBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10, marginTop: 10 },
  skinsCard: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, marginBottom: 16, ...theme.shadows.card },
  skinsCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  skinsCardTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  skinsGolferGrid: { flexDirection: 'row', gap: 8 },
  skinsGolferBox: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center' },
  skinsGolferName: { fontSize: 13, fontWeight: '800', color: theme.colors.textPrimary },
  skinsCountText: { fontSize: 12, fontWeight: '700', color: '#b45309', marginTop: 2 },
  skinsHoleRow: { flexDirection: 'row' },
  skinsHoleChip: { width: 90, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.background, marginRight: 8, alignItems: 'center' },
  skinsChipTie: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  skinsChipWin: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  skinsHoleNum: { fontSize: 11, fontWeight: '800', color: theme.colors.textPrimary },
  skinsTieText: { fontSize: 9, fontWeight: '800', color: '#dc2626', marginTop: 2 },
  skinsWinnerText: { fontSize: 9, fontWeight: '800', color: '#b45309', marginTop: 2 },
  skinsUnplayedText: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  segmentGrid: { gap: 8 },
  segmentCard: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  segmentTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  wagerBadge: { fontSize: 11, fontWeight: '700', color: theme.colors.primary, backgroundColor: theme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  segmentWinner: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
  balanceList: { gap: 8 },
  balanceRow: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, flexDirection: 'row', alignItems: 'center', ...theme.shadows.card },
  golferName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  breakdownText: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  totalWonLostText: { fontSize: 16, fontWeight: '800', color: theme.colors.textSecondary },
  winnerGreen: { color: theme.colors.primary },
  loserRed: { color: '#dc2626' },
  noPaymentsBox: { backgroundColor: theme.colors.cardBg, padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  noPaymentsText: { color: theme.colors.textSecondary, fontWeight: '700', fontSize: 13 },
  transactionCard: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, marginBottom: 10, ...theme.shadows.card },
  txnSummary: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary },
  txnDetails: { fontSize: 12, color: theme.colors.textMuted, marginTop: 3, marginBottom: 10 },
  payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  payButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
});
