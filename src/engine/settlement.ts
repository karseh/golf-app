import { MatchConfig, MatchResults, GolferBalance, PaymentTransaction, SettlementResult, Golfer } from '../types';

/**
 * Payment Deep Link Generator
 */
export function generatePaymentUrl(
  payee: Golfer,
  amount: number,
  note: string = 'Golf Match Settlement'
): string {
  const handle = payee.paymentHandle.trim();
  const method = payee.preferredPaymentMethod;

  switch (method) {
    case 'VENMO': {
      // Venmo deep link format
      const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
      return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(cleanHandle)}&amount=${amount.toFixed(2)}&note=${encodeURIComponent(note)}`;
    }
    case 'PAYPAL': {
      // PayPal me link format
      let cleanHandle = handle.replace('https://paypal.me/', '').replace('paypal.me/', '');
      return `https://paypal.me/${cleanHandle}/${amount.toFixed(2)}`;
    }
    case 'CASHAPP': {
      // CashApp link format
      const cleanHandle = handle.startsWith('$') ? handle.substring(1) : handle;
      return `https://cash.app/$${cleanHandle}/${amount.toFixed(2)}`;
    }
    case 'ZELLE': {
      // Zelle text note summary format
      return `zelle:${encodeURIComponent(handle)}?amount=${amount.toFixed(2)}`;
    }
    default:
      return '';
  }
}

/**
 * Settlement Engine & Pairwise Net Debt Minimizer
 */
export function calculateSettlement(
  config: MatchConfig,
  results: MatchResults
): SettlementResult {
  const { wagers, skinsWager, participants, gameFormat, teams } = config;
  const golferBalancesMap: Map<string, { golfer: Golfer; front9: number; back9: number; overall18: number }> = new Map();

  participants.forEach(p => {
    golferBalancesMap.set(p.golfer.id, {
      golfer: p.golfer,
      front9: 0,
      back9: 0,
      overall18: 0,
    });
  });

  if (gameFormat === 'SKINS' && results.skinsResults) {
    // Skins Settlement Logic
    const skinAmount = skinsWager?.skinAmount ?? 5;
    const { golferSkinCounts, totalSkinsWon } = results.skinsResults;
    const numPlayers = participants.length;

    participants.forEach(p => {
      const golferId = p.golfer.id;
      const skinsWon = golferSkinCounts[golferId] || 0;
      const skinsWonByOthers = totalSkinsWon - skinsWon;
      // Net skins balance = (skinsWon * (N - 1)) - skinsWonByOthers
      const netSkins = numPlayers > 1 ? (skinsWon * (numPlayers - 1)) - skinsWonByOthers : 0;
      const netAmount = netSkins * skinAmount;

      const bal = golferBalancesMap.get(golferId);
      if (bal) {
        bal.overall18 += netAmount;
      }
    });
  } else {
    // Segment Wager Logic (Nassau / Match Play / Stroke Play)
    const applySegmentWager = (
      winnerGolferId?: string,
      winnerTeamId?: number,
      isHalved: boolean = false,
      wagerAmount: number = 0,
      segmentKey: 'front9' | 'back9' | 'overall18' = 'front9'
    ) => {
      if (isHalved || wagerAmount <= 0) return;

      if (gameFormat === 'MATCH_PLAY_TEAMS' && teams && winnerTeamId) {
        const winningTeam = teams.find(t => t.id === winnerTeamId);
        const losingTeam = teams.find(t => t.id !== winnerTeamId);

        if (winningTeam && losingTeam) {
          // Each losing team player pays segment wager amount to winning team players
          losingTeam.playerIds.forEach(loserId => {
            const bal = golferBalancesMap.get(loserId);
            if (bal) bal[segmentKey] -= wagerAmount;
          });

          winningTeam.playerIds.forEach(winnerId => {
            const bal = golferBalancesMap.get(winnerId);
            if (bal) bal[segmentKey] += wagerAmount;
          });
        }
      } else if (winnerGolferId) {
        // Individual winner
        const winnerBal = golferBalancesMap.get(winnerGolferId);
        if (winnerBal) winnerBal[segmentKey] += wagerAmount * (participants.length - 1);

        participants.forEach(p => {
          if (p.golfer.id !== winnerGolferId) {
            const loserBal = golferBalancesMap.get(p.golfer.id);
            if (loserBal) loserBal[segmentKey] -= wagerAmount;
          }
        });
      }
    };

    applySegmentWager(results.front9.winnerGolferId, results.front9.winnerTeamId, results.front9.isHalved, wagers.front9, 'front9');
    applySegmentWager(results.back9.winnerGolferId, results.back9.winnerTeamId, results.back9.isHalved, wagers.back9, 'back9');
    applySegmentWager(results.overall18.winnerGolferId, results.overall18.winnerTeamId, results.overall18.isHalved, wagers.overall18, 'overall18');
  }

  // Compute final Golfer Balances
  const golferBalances: GolferBalance[] = [];
  golferBalancesMap.forEach((bal, golferId) => {
    const totalWonLost = bal.front9 + bal.back9 + bal.overall18;
    golferBalances.push({
      golferId,
      name: bal.golfer.name,
      totalWonLost,
      segmentBreakdown: {
        front9: bal.front9,
        back9: bal.back9,
        overall18: bal.overall18,
      },
    });
  });

  // Net Debt Minimization (Greedy Pairwise Settlement)
  const debtors: { golfer: Golfer; amountOwed: number }[] = [];
  const creditors: { golfer: Golfer; amountDue: number }[] = [];

  golferBalancesMap.forEach((bal) => {
    const net = bal.front9 + bal.back9 + bal.overall18;
    if (net < -0.001) {
      debtors.push({ golfer: bal.golfer, amountOwed: Math.abs(net) });
    } else if (net > 0.001) {
      creditors.push({ golfer: bal.golfer, amountDue: net });
    }
  });

  const transactions: PaymentTransaction[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const paymentAmount = Math.min(debtor.amountOwed, creditor.amountDue);

    if (paymentAmount > 0.001) {
      const courseName = config.course.name;
      const note = `Golf Match (${courseName}) - Settlement`;
      const paymentUrl = generatePaymentUrl(creditor.golfer, paymentAmount, note);
      const summaryText = `${debtor.golfer.name} owes ${creditor.golfer.name} $${paymentAmount.toFixed(2)} via ${creditor.golfer.preferredPaymentMethod}`;

      transactions.push({
        fromGolfer: debtor.golfer,
        toGolfer: creditor.golfer,
        amount: paymentAmount,
        paymentUrl,
        paymentSummaryText: summaryText,
      });
    }

    debtor.amountOwed -= paymentAmount;
    creditor.amountDue -= paymentAmount;

    if (debtor.amountOwed < 0.01) i++;
    if (creditor.amountDue < 0.01) j++;
  }

  return {
    golferBalances,
    transactions,
  };
}
