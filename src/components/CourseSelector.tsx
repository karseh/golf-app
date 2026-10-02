import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Course, TeeBox } from '../types';
import { BAY_AREA_COURSES } from '../data/bayAreaCourses';
import { theme } from '../theme';
import { MapPin, Search, Flag, Award, CheckCircle2 } from 'lucide-react-native';

interface CourseSelectorProps {
  selectedCourse: Course;
  onSelectCourse: (course: Course) => void;
  selectedTee: TeeBox;
  onSelectTee: (tee: TeeBox) => void;
}

export const CourseSelector: React.FC<CourseSelectorProps> = ({
  selectedCourse,
  onSelectCourse,
  selectedTee,
  onSelectTee,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = BAY_AREA_COURSES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <Text style={styles.title}>Bay Area Courses</Text>
      <Text style={styles.subtitle}>Select course ratings, slope ratings, pars, and 18-hole handicap indexes</Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search color={theme.colors.textMuted} size={16} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search course name or city..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Course List */}
      <Text style={styles.sectionHeader}>Available Bay Area Courses ({filteredCourses.length})</Text>
      <View style={styles.courseList}>
        {filteredCourses.map(course => {
          const isSelected = selectedCourse.id === course.id;
          return (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseCard, isSelected && styles.courseCardSelected]}
              onPress={() => {
                onSelectCourse(course);
                onSelectTee(course.teeBoxes[0]);
              }}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Flag size={16} color={isSelected ? theme.colors.primary : theme.colors.textMuted} />
                  <Text style={[styles.courseName, isSelected && styles.courseNameSelected]}>{course.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <MapPin size={11} color={theme.colors.textMuted} />
                  <Text style={styles.courseCity}>{course.city}, {course.state}</Text>
                </View>
              </View>

              {isSelected && (
                <View style={styles.selectedBadge}>
                  <CheckCircle2 size={13} color={theme.colors.primary} />
                  <Text style={styles.selectedBadgeText}>Active</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tee Box Selection */}
      <Text style={styles.sectionHeader}>Tee Box Setup ({selectedCourse.name})</Text>
      <View style={styles.teeContainer}>
        {selectedCourse.teeBoxes.map(tee => {
          const isTeeSelected = selectedTee.name === tee.name;
          return (
            <TouchableOpacity
              key={tee.name}
              style={[styles.teeCard, isTeeSelected && styles.teeCardSelected]}
              onPress={() => onSelectTee(tee)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.teeName, isTeeSelected && styles.teeNameSelected]}>{tee.name} Tee</Text>
                <Text style={styles.parBadge}>Par {tee.par}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Award size={11} color={theme.colors.primary} />
                  <Text style={styles.statText}>Rating: {tee.courseRating}</Text>
                </View>

                <View style={styles.statPill}>
                  <Text style={styles.statText}>Slope: {tee.slopeRating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8, marginBottom: 20, ...theme.shadows.card },
  searchInput: { flex: 1, color: theme.colors.textPrimary, fontSize: 13 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  courseList: { gap: 8, marginBottom: 24 },
  courseCard: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, flexDirection: 'row', alignItems: 'center', ...theme.shadows.card },
  courseCardSelected: { borderColor: theme.colors.primaryBorder, backgroundColor: theme.colors.primaryLight, borderWidth: 1.5 },
  courseName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  courseNameSelected: { color: theme.colors.primary },
  courseCity: { fontSize: 12, color: theme.colors.textMuted },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.cardBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  selectedBadgeText: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
  teeContainer: { gap: 8 },
  teeCard: { backgroundColor: theme.colors.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadows.card },
  teeCardSelected: { borderColor: theme.colors.primaryBorder, backgroundColor: theme.colors.primaryLight, borderWidth: 1.5 },
  teeName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  teeNameSelected: { color: theme.colors.primary },
  parBadge: { backgroundColor: theme.colors.subtleBg, color: theme.colors.textPrimary, fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.subtleBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' },
});
