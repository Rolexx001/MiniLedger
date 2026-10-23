import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react-native';

interface BadgeProps {
  status: 'PENDING' | 'REPAID';
  isOverdue?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ status, isOverdue = false }) => {
  if (status === 'REPAID') {
    return (
      <View style={[styles.badge, styles.repaidBadge]}>
        <CheckCircle2 size={12} color="#059669" strokeWidth={2.5} />
        <Text style={[styles.text, styles.repaidText]}>Repaid</Text>
      </View>
    );
  }

  if (isOverdue) {
    return (
      <View style={[styles.badge, styles.overdueBadge]}>
        <AlertTriangle size={12} color="#DC2626" strokeWidth={2.5} />
        <Text style={[styles.text, styles.overdueText]}>Overdue</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.pendingBadge]}>
      <Clock size={12} color="#D97706" strokeWidth={2.5} />
      <Text style={[styles.text, styles.pendingText]}>Pending</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: {
    color: '#B45309',
  },
  repaidBadge: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  repaidText: {
    color: '#047857',
  },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  overdueText: {
    color: '#B91C1C',
  },
});
