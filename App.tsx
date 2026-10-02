import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Golfer, Course, TeeBox, GameFormat, ScoringMode, Wagers, SkinsWager, MatchConfig, Team, MatchParticipant, Game } from './src/types';
import { BAY_AREA_COURSES } from './src/data/bayAreaCourses';
import { calculateCourseHandicap } from './src/engine/handicap';
import { calculateMatchPlay } from './src/engine/matchPlay';
import { calculateStrokePlay } from './src/engine/strokePlay';
import { calculateSkins } from './src/engine/skins';
import { calculateSettlement } from './src/engine/settlement';
import { loadStoredGames, saveStoredGames, calculateOpponentMatrix, INITIAL_GOLFERS, computeGameResults } from './src/services/gameStorage';

// UI Components
import { DashboardLanding } from './src/components/DashboardLanding';
import { PlayerDashboard } from './src/components/PlayerDashboard';
import { GolferRoster } from './src/components/GolferRoster';
import { CourseSelector } from './src/components/CourseSelector';
import { MatchSetup } from './src/components/MatchSetup';
import { ScoringGrid } from './src/components/ScoringGrid';
import { ResultsSettlement } from './src/components/ResultsSettlement';
import { NewGameModal } from './src/components/NewGameModal';
import { theme } from './src/theme';

// Icons
import { LayoutDashboard, Users, Trophy, Play, PlusCircle, ArrowLeft, Flag, Settings, Edit3, DollarSign, Award, ChevronRight, ShieldCheck } from 'lucide-react-native';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [golfers, setGolfers] = useState<Golfer[]>(INITIAL_GOLFERS);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
  // Navigation State
  const [mainView, setMainView] = useState<'dashboard' | 'ledger' | 'roster' | 'game'>('dashboard');
  const [gameSubTab, setGameSubTab] = useState<'scoring' | 'setup' | 'course' | 'results'>('scoring');
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState<boolean>(false);

  // Load saved games on mount
  useEffect(() => {
    const loaded = loadStoredGames();
    setGames(loaded);
    if (loaded.length > 0) {
      const activeGame = loaded.find(g => g.status === 'in_progress') || loaded[0];
      setSelectedGameId(activeGame.id);
    }
  }, []);

  // Save games whenever updated
  const updateGamesState = (nextGames: Game[]) => {
    setGames(nextGames);
    saveStoredGames(nextGames);
  };

  const selectedGame = games.find(g => g.id === selectedGameId);

  // Handlers for New Game Creation
  const handleCreateGame = (
    name: string,
    course: Course,
    tee: TeeBox,
    format: GameFormat,
    mode: ScoringMode,
    wagers: Wagers,
    skinsWager: SkinsWager,
    selectedGolferIds: string[]
  ) => {
    const gameParticipants: MatchParticipant[] = selectedGolferIds.map(id => {
      const golfer = golfers.find(g => g.id === id)!;
      const ch = calculateCourseHandicap(
        golfer.handicapIndex,
        tee.slopeRating,
        tee.courseRating,
        tee.par,
        1.0
      );
      return {
        golfer,
        courseHandicap: ch,
        grossScores: Array(18).fill(null),
      };
    });

    const newGameConfig: MatchConfig = {
      id: `game_${Date.now()}`,
      course,
      selectedTee: tee,
      gameFormat: format,
      scoringMode: mode,
      handicapAllowancePct: 1.0,
      wagers,
      skinsWager,
      participants: gameParticipants,
      teams: [
        { id: 1, name: 'Team 1', playerIds: selectedGolferIds.slice(0, Math.ceil(selectedGolferIds.length / 2)) },
        { id: 2, name: 'Team 2', playerIds: selectedGolferIds.slice(Math.ceil(selectedGolferIds.length / 2)) },
      ],
    };

    const newGame: Game = {
      id: newGameConfig.id,
      name,
      createdAt: new Date().toISOString(),
      status: 'in_progress',
      config: newGameConfig,
      grossScoresMap: gameParticipants.reduce((acc, p) => {
        acc[p.golfer.id] = p.grossScores;
        return acc;
      }, {} as Record<string, (number | null)[]>),
    };

    const nextGames = [newGame, ...games];
    updateGamesState(nextGames);
    setSelectedGameId(newGame.id);
    setMainView('game');
    setGameSubTab('scoring');
  };

  // Handlers for Golfer Management
  const handleAddGolfer = (newGolfer: Golfer) => {
    setGolfers(prev => [...prev, newGolfer]);
  };

  // Handlers for Active Game Score Edits
  const handleScoreChange = (golferId: string, updatedScores: (number | null)[]) => {
    if (!selectedGame) return;

    const nextGames = games.map(g => {
      if (g.id !== selectedGame.id) return g;

      const updatedParticipants = g.config.participants.map(p => {
        if (p.golfer.id === golferId) {
          return { ...p, grossScores: updatedScores };
        }
        return p;
      });

      return {
        ...g,
        config: {
          ...g.config,
          participants: updatedParticipants,
        },
        grossScoresMap: {
          ...g.grossScoresMap,
          [golferId]: updatedScores,
        },
      };
    });

    updateGamesState(nextGames);
  };

  const handleApplyParsedScores = (parsedData: { golferId: string; grossScores: number[] }[]) => {
    if (!selectedGame) return;

    const nextGames = games.map(g => {
      if (g.id !== selectedGame.id) return g;

      const nextGrossMap = { ...g.grossScoresMap };
      parsedData.forEach(item => {
        nextGrossMap[item.golferId] = item.grossScores;
      });

      const updatedParticipants = g.config.participants.map(p => {
        if (nextGrossMap[p.golfer.id]) {
          return { ...p, grossScores: nextGrossMap[p.golfer.id] };
        }
        return p;
      });

      return {
        ...g,
        config: { ...g.config, participants: updatedParticipants },
        grossScoresMap: nextGrossMap,
      };
    });

    updateGamesState(nextGames);
  };

  // Handlers for Game Lifecycle (Close / Complete / Reopen)
  const handleMarkCompleted = (gameId: string) => {
    const targetGame = games.find(g => g.id === gameId);
    if (!targetGame) return;

    const nextGames = games.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
        };
      }
      return g;
    });

    updateGamesState(nextGames);
    Alert.alert('Game Completed', `"${targetGame.name}" is now marked as Completed! Opponent ledgers have been updated.`);
  };

  const handleReopenGame = (gameId: string) => {
    const targetGame = games.find(g => g.id === gameId);
    if (!targetGame) return;

    const nextGames = games.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          status: 'in_progress' as const,
        };
      }
      return g;
    });

    updateGamesState(nextGames);
    Alert.alert('Game Re-opened', `"${targetGame.name}" is now active and editable.`);
  };

  // Select game from dashboard
  const handleSelectGame = (gameId: string, initialTab: 'scoring' | 'setup' | 'results' = 'scoring') => {
    setSelectedGameId(gameId);
    setMainView('game');
    setGameSubTab(initialTab);
  };

  // Calculate Opponent Head to Head Matrix
  const headToHeadMatrix = calculateOpponentMatrix(games, golfers);

  // Selected game calculations
  let selectedMatchResults = null;
  let selectedSettlement = null;

  if (selectedGame) {
    selectedMatchResults = computeGameResults(selectedGame);
    selectedSettlement = calculateSettlement(selectedGame.config, selectedMatchResults);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appShell}>
        {/* Top App Header */}
        <View style={styles.headerBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={{ fontSize: 18 }}>⛳</Text>
            </View>
            <View>
              <Text style={styles.appTitle}>GolfMatch Pro</Text>
              <Text style={styles.appSubTitle}>Multi-Game Match Play • Skins • Opponent Ledger</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerNewGameBtn}
            onPress={() => setIsNewGameModalOpen(true)}
            activeOpacity={0.85}
          >
            <PlusCircle size={15} color="#ffffff" />
            <Text style={styles.headerNewGameText}>New Game</Text>
          </TouchableOpacity>
        </View>

        {/* Global Navigation Bar */}
        <View style={styles.mainNavContainer}>
          <TouchableOpacity
            style={[styles.mainNavChip, mainView === 'dashboard' && styles.mainNavChipActive]}
            onPress={() => setMainView('dashboard')}
          >
            <LayoutDashboard size={15} color={mainView === 'dashboard' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.mainNavText, mainView === 'dashboard' && styles.mainNavTextActive]}>
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainNavChip, mainView === 'ledger' && styles.mainNavChipActive]}
            onPress={() => setMainView('ledger')}
          >
            <Trophy size={15} color={mainView === 'ledger' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.mainNavText, mainView === 'ledger' && styles.mainNavTextActive]}>
              Opponent Ledger
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainNavChip, mainView === 'roster' && styles.mainNavChipActive]}
            onPress={() => setMainView('roster')}
          >
            <Users size={15} color={mainView === 'roster' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.mainNavText, mainView === 'roster' && styles.mainNavTextActive]}>
              Players ({golfers.length})
            </Text>
          </TouchableOpacity>

          {selectedGame && (
            <TouchableOpacity
              style={[styles.mainNavChip, mainView === 'game' && styles.mainNavChipActive, { borderLeftWidth: 2, borderLeftColor: theme.colors.primary }]}
              onPress={() => setMainView('game')}
            >
              <Play size={15} color={mainView === 'game' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.mainNavText, mainView === 'game' && styles.mainNavTextActive]} numberOfLines={1}>
                Match ({selectedGame.name.split(' ')[0]})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content Body */}
        <View style={styles.bodyContent}>
          {mainView === 'dashboard' && (
            <DashboardLanding
              games={games}
              onSelectGame={handleSelectGame}
              onOpenNewGameModal={() => setIsNewGameModalOpen(true)}
              onReopenGame={handleReopenGame}
            />
          )}

          {mainView === 'ledger' && (
            <PlayerDashboard
              golfers={golfers}
              headToHeadMatrix={headToHeadMatrix}
            />
          )}

          {mainView === 'roster' && (
            <GolferRoster
              golfers={golfers}
              onAddGolfer={handleAddGolfer}
              selectedGolferIds={selectedGame ? selectedGame.config.participants.map(p => p.golfer.id) : []}
              onToggleSelectGolfer={() => {}}
            />
          )}

          {mainView === 'game' && selectedGame && selectedMatchResults && selectedSettlement && (
            <View style={{ flex: 1 }}>
              {/* Active Match Sub-Header Bar */}
              <View style={styles.activeGameSubHeader}>
                <TouchableOpacity
                  style={styles.backToDashBtn}
                  onPress={() => setMainView('dashboard')}
                >
                  <ArrowLeft size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.backToDashText}>Dashboard</Text>
                </TouchableOpacity>

                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text style={styles.activeGameName}>{selectedGame.name}</Text>
                  <Text style={styles.activeGameSub}>
                    {selectedGame.config.course.name} • {selectedGame.config.gameFormat.replace(/_/g, ' ')}
                  </Text>
                </View>

                {selectedGame.status === 'completed' ? (
                  <View style={styles.completedBadgeHeader}>
                    <ShieldCheck size={13} color="#166534" />
                    <Text style={styles.completedBadgeHeaderText}>COMPLETED</Text>
                  </View>
                ) : (
                  <View style={styles.activeBadgeHeader}>
                    <Text style={styles.activeBadgeHeaderText}>ACTIVE</Text>
                  </View>
                )}
              </View>

              {/* Game Sub-Tabs Navigation */}
              <View style={styles.gameSubTabContainer}>
                {[
                  { key: 'scoring', label: 'Scorecard', icon: Edit3 },
                  { key: 'setup', label: 'Match Rules', icon: Settings },
                  { key: 'course', label: 'Course Info', icon: Flag },
                  { key: 'results', label: 'Settlement', icon: DollarSign },
                ].map(tab => {
                  const IconComp = tab.icon;
                  const isActive = gameSubTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.gameSubTabChip, isActive && styles.gameSubTabChipActive]}
                      onPress={() => setGameSubTab(tab.key as any)}
                    >
                      <IconComp size={14} color={isActive ? theme.colors.primary : theme.colors.textSecondary} />
                      <Text style={[styles.gameSubTabText, isActive && styles.gameSubTabTextActive]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Game View Content */}
              <View style={{ flex: 1 }}>
                {gameSubTab === 'scoring' && (
                  <ScoringGrid
                    config={selectedGame.config}
                    onChangeScores={handleScoreChange}
                    onApplyParsedScores={handleApplyParsedScores}
                  />
                )}

                {gameSubTab === 'setup' && (
                  <MatchSetup
                    gameFormat={selectedGame.config.gameFormat}
                    onSelectGameFormat={f => {
                      const nextGames = games.map(g => g.id === selectedGame.id ? { ...g, config: { ...g.config, gameFormat: f } } : g);
                      updateGamesState(nextGames);
                    }}
                    scoringMode={selectedGame.config.scoringMode}
                    onSelectScoringMode={m => {
                      const nextGames = games.map(g => g.id === selectedGame.id ? { ...g, config: { ...g.config, scoringMode: m } } : g);
                      updateGamesState(nextGames);
                    }}
                    handicapAllowancePct={selectedGame.config.handicapAllowancePct}
                    onSelectAllowancePct={p => {
                      const nextGames = games.map(g => g.id === selectedGame.id ? { ...g, config: { ...g.config, handicapAllowancePct: p } } : g);
                      updateGamesState(nextGames);
                    }}
                    wagers={selectedGame.config.wagers}
                    onChangeWagers={w => {
                      const nextGames = games.map(g => g.id === selectedGame.id ? { ...g, config: { ...g.config, wagers: w } } : g);
                      updateGamesState(nextGames);
                    }}
                    skinsWager={selectedGame.config.skinsWager}
                    onChangeSkinsWager={sw => {
                      const nextGames = games.map(g => g.id === selectedGame.id ? { ...g, config: { ...g.config, skinsWager: sw } } : g);
                      updateGamesState(nextGames);
                    }}
                    selectedGolfers={selectedGame.config.participants.map(p => p.golfer)}
                    teams={selectedGame.config.teams || []}
                    onChangeTeams={t => {
                      const nextGames = games.map(g => g.id === selectedGame.id ? { ...g, config: { ...g.config, teams: t } } : g);
                      updateGamesState(nextGames);
                    }}
                  />
                )}

                {gameSubTab === 'course' && (
                  <CourseSelector
                    selectedCourse={selectedGame.config.course}
                    onSelectCourse={c => {
                      const nextGames = games.map(g => g.id === selectedGame.id ? { ...g, config: { ...g.config, course: c, selectedTee: c.teeBoxes[0] } } : g);
                      updateGamesState(nextGames);
                    }}
                    selectedTee={selectedGame.config.selectedTee}
                    onSelectTee={t => {
                      const nextGames = games.map(g => g.id === selectedGame.id ? { ...g, config: { ...g.config, selectedTee: t } } : g);
                      updateGamesState(nextGames);
                    }}
                  />
                )}

                {gameSubTab === 'results' && (
                  <ResultsSettlement
                    config={selectedGame.config}
                    matchResults={selectedMatchResults}
                    settlement={selectedSettlement}
                    gameStatus={selectedGame.status}
                    onMarkCompleted={() => handleMarkCompleted(selectedGame.id)}
                    onReopenGame={() => handleReopenGame(selectedGame.id)}
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Modal for Creating a New Game */}
      <NewGameModal
        visible={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        golfers={golfers}
        onAddGolfer={handleAddGolfer}
        onCreateGame={handleCreateGame}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  appShell: { flex: 1, width: '100%', maxWidth: 980, alignSelf: 'center', backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: theme.colors.cardBorder },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primaryBorder },
  appTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3 },
  appSubTitle: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  headerNewGameBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, ...theme.shadows.button },
  headerNewGameText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  mainNavContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: theme.colors.cardBorder, gap: 6 },
  mainNavChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.cardBorder },
  mainNavChipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  mainNavText: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary },
  mainNavTextActive: { color: theme.colors.primary },
  bodyContent: { flex: 1, backgroundColor: theme.colors.background },
  activeGameSubHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.colors.cardBg, borderBottomWidth: 1, borderColor: theme.colors.cardBorder },
  backToDashBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.cardBorder },
  backToDashText: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  activeGameName: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  activeGameSub: { fontSize: 11, color: theme.colors.textSecondary },
  activeBadgeHeader: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#86efac' },
  activeBadgeHeaderText: { fontSize: 10, fontWeight: '800', color: '#166534' },
  completedBadgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  completedBadgeHeaderText: { fontSize: 10, fontWeight: '800', color: '#4b5563' },
  gameSubTabContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: theme.colors.cardBorder, gap: 6 },
  gameSubTabChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.cardBorder },
  gameSubTabChipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder },
  gameSubTabText: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  gameSubTabTextActive: { color: theme.colors.primary },
});
