import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { CaretLeft } from 'phosphor-react-native';

export function NewAppointmentScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <CaretLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[TYPOGRAPHY.h2, styles.title]}>Nova Marcação</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Placeholder para o ecrã de Nova Marcação (Bottom Sheet ou Ecrã).</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
