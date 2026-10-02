import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { parseScorecardImage, ScorecardOcrResult } from '../services/scorecardOcr';
import { MatchParticipant } from '../types';

interface ScorecardUploadModalProps {
  visible: boolean;
  onClose: () => void;
  participants: MatchParticipant[];
  onApplyParsedScores: (parsedData: { golferId: string; grossScores: number[] }[]) => void;
}

export const ScorecardUploadModal: React.FC<ScorecardUploadModalProps> = ({
  visible,
  onClose,
  participants,
  onApplyParsedScores,
}) => {
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<ScorecardOcrResult | null>(null);

  const handleSimulateScan = async () => {
    setLoading(true);
    const res = await parseScorecardImage('simulated-scorecard-image-uri');
    setOcrResult(res);
    setLoading(false);
  };

  const handleConfirm = () => {
    if (!ocrResult) return;

    // Map OCR detected rows to match participants
    const mappings = participants.map((p, idx) => {
      const ocrRow = ocrResult.players[idx] || ocrResult.players[0];
      return {
        golferId: p.golfer.id,
        grossScores: ocrRow ? ocrRow.grossScores : Array(18).fill(4),
      };
    });

    onApplyParsedScores(mappings);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>📸 AI Vision Scorecard OCR</Text>
          <Text style={styles.subtitle}>
            Upload a physical scorecard photo to parse hole scores & auto-populate the match grid.
          </Text>

          {!ocrResult ? (
            <View style={styles.placeholderContainer}>
              {loading ? (
                <View style={{ alignItems: 'center', padding: 20 }}>
                  <ActivityIndicator size="large" color="#3182ce" />
                  <Text style={{ marginTop: 10, color: '#4a5568', fontWeight: 'bold' }}>
                    Parsing scorecard image & detecting player rows...
                  </Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.scanButton} onPress={handleSimulateScan}>
                  <Text style={styles.scanButtonText}>📷 Select Scorecard Image / Take Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.parsedContainer}>
              <Text style={styles.detectedHeader}>
                Course Detected: {ocrResult.detectedCourseName} ({Math.round(ocrResult.confidence * 100)}% Confidence)
              </Text>
              {ocrResult.players.map((p, i) => (
                <View key={i} style={styles.parsedRow}>
                  <Text style={styles.parsedName}>{p.rawName}:</Text>
                  <Text style={styles.parsedScores}>
                    Front 9: {p.grossScores.slice(0, 9).join(', ')} (Tot: {p.grossScores.reduce((a, b) => a + b, 0)})
                  </Text>
                </View>
              ))}

              <TouchableOpacity style={styles.applyButton} onPress={handleConfirm}>
                <Text style={styles.applyButtonText}>✓ Confirm & Auto-Populate Match Scores</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 500 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a365d', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#4a5568', marginBottom: 16 },
  placeholderContainer: { padding: 30, backgroundColor: '#f7fafc', borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#cbd5e0', borderStyle: 'dashed' },
  scanButton: { backgroundColor: '#3182ce', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10 },
  scanButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  parsedContainer: { gap: 10 },
  detectedHeader: { fontSize: 14, fontWeight: 'bold', color: '#2f855a', marginBottom: 6 },
  parsedRow: { backgroundColor: '#edf2f7', padding: 10, borderRadius: 8 },
  parsedName: { fontSize: 14, fontWeight: 'bold', color: '#2d3748' },
  parsedScores: { fontSize: 12, color: '#4a5568', marginTop: 2 },
  applyButton: { backgroundColor: '#2f855a', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  applyButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  closeButton: { marginTop: 12, alignItems: 'center', padding: 8 },
  closeButtonText: { color: '#e53e3e', fontWeight: 'bold' },
});
