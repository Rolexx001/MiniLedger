import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ArrowLeft,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { loansApi, getErrorMessage } from '../../lib/api';
import { Loan } from '../../types';

export default function LoanDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRepaying, setIsRepaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLoan = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await loansApi.getLoan(id);
      setLoan(response.loan);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [id]);

  const handleMarkAsRepaid = () => {
    if (!loan || loan.status === 'REPAID') return;

    const performRepayment = async () => {
      setIsRepaying(true);
      try {
        const response = await loansApi.repayLoan(loan.id);
        setLoan(response.loan);
        if (Platform.OS !== 'web') {
          Alert.alert('Loan Settled', 'This loan has been marked as fully repaid.');
        }
      } catch (err) {
        Alert.alert('Error', getErrorMessage(err));
      } finally {
        setIsRepaying(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Mark ₹${parseFloat(loan.amount).toLocaleString('en-IN')} from ${loan.friendName} as repaid?`)) {
        performRepayment();
      }
    } else {
      Alert.alert(
        'Confirm Repayment',
        `Has ${loan.friendName} returned ₹${parseFloat(loan.amount).toLocaleString('en-IN')}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Mark Repaid',
            style: 'default',
            onPress: performRepayment,
          },
        ]
      );
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (val?: string) => {
    if (!val) return '₹0.00';
    const num = parseFloat(val);
    if (isNaN(num)) return '₹' + val;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.loadingText}>Loading loan details...</Text>
      </View>
    );
  }

  if (errorMessage || !loan) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={44} color="#DC2626" />
        <Text style={styles.errorTitle}>Record Unavailable</Text>
        <Text style={styles.errorSubtitle}>
          {errorMessage || 'The requested loan record could not be found or you do not have permission to view it.'}
        </Text>
        <Button
          title="Back to Dashboard"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const isPending = loan.status === 'PENDING';
  const isOverdue = isPending && loan.isOverdue;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Overdue Alert Banner */}
      {isOverdue && (
        <View style={styles.overdueBanner}>
          <AlertTriangle size={20} color="#DC2626" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.overdueBannerTitle}>Payment Overdue</Text>
            <Text style={styles.overdueBannerText}>
              The due date ({formatDate(loan.dueDate)}) has passed. Consider sending a friendly reminder.
            </Text>
          </View>
        </View>
      )}

      {/* Main Loan Details Card */}
      <Card variant="elevated" style={styles.mainCard}>
        {/* Top Header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {loan.friendName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.friendName}>{loan.friendName}</Text>
            <Text style={styles.loanSubtitle}>Friend & Borrower</Text>
          </View>
          <Badge status={loan.status} isOverdue={isOverdue} />
        </View>

        {/* Amount Box */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Loan Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(loan.amount)}</Text>
        </View>

        {/* Details List */}
        <View style={styles.infoList}>
          {/* Due Date */}
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Calendar size={18} color="#64748B" />
              <Text style={styles.infoLabel}>Due Date</Text>
            </View>
            <Text
              style={[
                styles.infoValue,
                isOverdue && styles.infoValueOverdue,
              ]}
            >
              {formatDate(loan.dueDate)}
            </Text>
          </View>

          {/* Creation Date */}
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Clock size={18} color="#64748B" />
              <Text style={styles.infoLabel}>Date Lent</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(loan.createdAt)}</Text>
          </View>

          {/* Status */}
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <CheckCircle2 size={18} color="#64748B" />
              <Text style={styles.infoLabel}>Current Status</Text>
            </View>
            <Text
              style={[
                styles.infoValue,
                loan.status === 'REPAID' ? styles.statusRepaid : styles.statusPending,
              ]}
            >
              {loan.status === 'REPAID' ? 'Settled / Repaid' : 'Pending Return'}
            </Text>
          </View>

          {/* Repayment Date (if repaid) */}
          {loan.repaidAt && (
            <View style={[styles.infoRow, styles.lastRow]}>
              <View style={styles.infoRowLeft}>
                <Check size={18} color="#059669" />
                <Text style={styles.infoLabel}>Settled On</Text>
              </View>
              <Text style={[styles.infoValue, styles.statusRepaid]}>
                {formatDate(loan.repaidAt)}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Action Section */}
      <View style={styles.actionContainer}>
        {isPending ? (
          <Button
            title="Mark as Repaid"
            variant="success"
            size="lg"
            icon={<CheckCircle2 size={20} color="#FFFFFF" />}
            isLoading={isRepaying}
            onPress={handleMarkAsRepaid}
          />
        ) : (
          <View style={styles.settledBadgeBox}>
            <CheckCircle2 size={24} color="#059669" />
            <Text style={styles.settledTitle}>Loan Fully Settled</Text>
            <Text style={styles.settledSubtext}>
              This loan was settled on {formatDate(loan.repaidAt)}. No further action is needed.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  overdueBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  overdueBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  overdueBannerText: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 16,
  },
  mainCard: {
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  loanSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  amountBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginVertical: 18,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  infoList: {
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  lastRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  infoValueOverdue: {
    color: '#DC2626',
    fontWeight: '700',
  },
  statusPending: {
    color: '#D97706',
  },
  statusRepaid: {
    color: '#059669',
  },
  actionContainer: {
    marginTop: 8,
  },
  settledBadgeBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settledTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginTop: 8,
    marginBottom: 4,
  },
  settledSubtext: {
    fontSize: 13,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 18,
  },
});
